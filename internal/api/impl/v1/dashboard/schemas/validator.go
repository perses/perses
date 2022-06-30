// Copyright 2022 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package schemas

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/load"
	"github.com/perses/perses/internal/config"
	"github.com/sirupsen/logrus"
)

const (
	kindField         = "kind"
	datasourceField   = "datasource"
	panelDefPath      = "#panel"
	datasourceDefPath = "#" + datasourceField
	queryDefPath      = "#query"
)

//go:embed base_def_chart.cue
var baseChartDef []byte

//go:embed base_def_query.cue
var baseQueryDef []byte

// retrieveSchemaForKind returns the schema corresponding to the provided kind
func retrieveSchemaForKind(panelName string, panelVal cue.Value, kindPath string, schemasMap *sync.Map) (cue.Value, error) {
	// retrieve the value of the Kind field
	kind, err := panelVal.LookupPath(cue.ParsePath(kindPath)).String()
	if err != nil {
		err = fmt.Errorf("invalid panel %s: %s", panelName, err) // enrich the error message returned by cue lib
		logrus.Debug(err)
		return cue.Value{}, err
	}

	// retrieve the corresponding schema
	schema, ok := schemasMap.Load(kind)
	if !ok {
		err := fmt.Errorf("invalid panel %s: Unknown %s %s", panelName, kindPath, kind)
		logrus.Debug(err)
		return cue.Value{}, err
	}

	return schema.(cue.Value), nil
}

// Validator can be used to run checks on panels, based on cuelang definitions
type Validator interface {
	Validate(panels map[string]json.RawMessage) error
	LoadCharts()
	LoadQueries()
}

type validator struct {
	context *cue.Context
	charts  cueDefs
	queries cueDefs
}

// NewValidator instantiate a validator
func NewValidator(conf config.Schemas) Validator {
	ctx := cuecontext.New()

	// compile the base definitions
	baseChartDefVal := ctx.CompileBytes(baseChartDef)
	baseQueryDefVal := ctx.CompileBytes(baseQueryDef)

	return &validator{
		context: ctx,
		charts: cueDefs{
			context:     ctx,
			baseDef:     baseChartDefVal,
			schemas:     &sync.Map{},
			schemasPath: conf.ChartsPath,
			kindCuePath: fmt.Sprintf("%s.%s", panelDefPath, kindField),
		},
		queries: cueDefs{
			context:     ctx,
			baseDef:     baseQueryDefVal,
			schemas:     &sync.Map{},
			schemasPath: conf.QueriesPath,
			kindCuePath: fmt.Sprintf("%s.%s", datasourceDefPath, kindField),
		},
	}
}

// Validate verify a list of panels.
// The panels are matched against the known list of CUE definitions (schemas).
// If no schema matches for at least 1 panel, the validation fails.
func (v *validator) Validate(panels map[string]json.RawMessage) error {
	var res error

	// go through the panels list
	// the processing stops as soon as it detects an invalid panel -> TODO: improve this to return a list of all the errors encountered ?
	for panelName, panelJSON := range panels {
		logrus.Tracef("Panel to validate: %s", string(panelJSON))

		// compile the JSON panel into a CUE Value
		value := v.context.CompileBytes(panelJSON)

		chartSchema, err := retrieveSchemaForKind(panelName, value, kindField, v.charts.schemas)
		if err != nil {
			res = err
			break
		}
		logrus.Tracef("Chart schema to use: %+v", chartSchema.LookupPath(cue.ParsePath(panelDefPath)))

		querySchema, err := retrieveSchemaForKind(panelName, value, fmt.Sprintf("%s.%s", datasourceField, kindField), v.queries.schemas)
		if err != nil {
			res = err
			break
		}
		logrus.Tracef("Query schema to use: %+v", querySchema.LookupPath(cue.ParsePath(queryDefPath)))

		// unify panel and query schemas
		finalSchema := chartSchema.Unify(querySchema)
		if finalSchema.Err() != nil {
			logrus.WithError(finalSchema.Err()).Errorf("Error unifying chart and query schemas to validate panel %s", panelName)
			continue
		}

		// do the validation using the main #panel def of the schema
		unified := value.Unify(finalSchema.LookupPath(cue.ParsePath(panelDefPath)))
		opts := []cue.Option{
			cue.Concrete(true),
			cue.Attributes(true),
			cue.Definitions(true),
			cue.Hidden(true),
		}
		err = unified.Validate(opts...)
		if err != nil {
			err = fmt.Errorf("invalid panel %s: %s", panelName, err) // enrich the error message returned by cue lib
			logrus.Debug(err)
			res = err
			break
		}
	}

	if res == nil {
		logrus.Debug("All panels are valid")
	}

	return res
}

// LoadCharts loads the list of available charts plugins as CUE schemas
func (v *validator) LoadCharts() {
	v.charts.load()
}

// LoadQueries loads the list of available queries plugins as CUE schemas
func (v *validator) LoadQueries() {
	v.queries.load()
}

type cueDefs struct {
	context     *cue.Context
	baseDef     cue.Value
	schemas     *sync.Map
	schemasPath string
	kindCuePath string
}

// load the list of available plugins as CUE schemas
func (c *cueDefs) load() {
	files, err := os.ReadDir(c.schemasPath)
	if err != nil {
		logrus.WithError(err).Errorf("Not able to read from schemas dir %s", c.schemasPath)
		return
	}

	// newSchemas is used for double buffering, to avoid any issue when there are panels to validate at the same time load() is triggered
	newSchemas := make(map[string]cue.Value)

	// process each schema plugin to convert it into a CUE Value
	for _, file := range files {
		if !file.IsDir() {
			logrus.Warningf("Plugin %s is not a folder", file.Name())
			continue
		}

		schemaPath := filepath.Join(c.schemasPath, file.Name())

		// load the cue files into build.Instances slice
		buildInstances := load.Instances([]string{}, &load.Config{Dir: schemaPath})
		// we strongly assume that only 1 buildInstance should be returned, otherwise we skip it
		// TODO can probably be improved
		if len(buildInstances) != 1 {
			logrus.Errorf("The number of build instances for %s is != 1, skipping this schema", schemaPath)
			continue
		}
		buildInstance := buildInstances[0]

		// check for errors on the instances (these are typically parsing errors)
		if buildInstance.Err != nil {
			logrus.WithError(buildInstance.Err).Errorf("Error retrieving schema for %s, skipping this schema", schemaPath)
			continue
		}

		// build Value from the Instance
		schema := c.context.BuildInstance(buildInstance)
		if schema.Err() != nil {
			logrus.WithError(schema.Err()).Errorf("Error during build for %s, skipping this schema", schemaPath)
			continue
		}

		// unify with the base def to complete defaults + check if the plugin fulfils the base requirements
		finalSchema := c.baseDef.Unify(schema)
		if finalSchema.Err() != nil {
			logrus.WithError(finalSchema.Err()).Errorf("Error during schema validation for %s, skipping this schema", schemaPath)
			continue
		}

		// check if another schema for the same Kind was already registered
		kind, _ := finalSchema.LookupPath(cue.ParsePath(c.kindCuePath)).String()
		if _, ok := newSchemas[kind]; ok {
			logrus.Errorf("Conflict caused by %s: a schema already exists for kind %s, skipping this schema", schemaPath, kind)
			continue
		}

		newSchemas[kind] = finalSchema
		logrus.Debugf("Loaded schema %s from file %s", kind, schemaPath)
	}

	// make c.schemas equal to newSchemas: deep copy newSchemas to c.schemas, then remove any value of c.schemas not existing in newSchemas
	for key, value := range newSchemas {
		c.schemas.Store(key, value)
	}
	c.schemas.Range(func(key interface{}, value interface{}) bool {
		if _, ok := newSchemas[key.(string)]; !ok {
			c.schemas.Delete(key)
		}
		return true
	})

	logrus.Infof("Schemas at %s (re)loaded", c.schemasPath)
}
