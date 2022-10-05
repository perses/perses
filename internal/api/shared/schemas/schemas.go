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
	"sync"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/perses/internal/api/config"
	"github.com/sirupsen/logrus"
)

const (
	kindField           = "kind"
	datasourceField     = "datasource"
	panelDefPath        = "#panel"
	panelDatasourcePath = panelDefPath + "." + datasourceField
	datasourceDefPath   = "#" + datasourceField
	queryDefPath        = "#query"
)

//go:embed base_def_panel.cue
var basePanelDef []byte

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

type Schemas interface {
	ValidatePanels(panels map[string]json.RawMessage) error
	GetLoaders() []Loader
}

func New(conf config.Schemas) Schemas {
	ctx := cuecontext.New()

	// compile the base definitions
	basePanelDefVal := ctx.CompileBytes(basePanelDef)
	baseQueryDefVal := ctx.CompileBytes(baseQueryDef)

	return &sch{
		context: ctx,
		panels: &cueDefs{
			context:     ctx,
			baseDef:     basePanelDefVal,
			schemas:     &sync.Map{},
			schemasPath: conf.PanelsPath,
			kindCuePath: fmt.Sprintf("%s.%s", panelDefPath, kindField),
		},
		queries: &cueDefs{
			context:     ctx,
			baseDef:     baseQueryDefVal,
			schemas:     &sync.Map{},
			schemasPath: conf.QueriesPath,
			kindCuePath: fmt.Sprintf("%s.%s", datasourceDefPath, kindField),
		},
	}
}

type sch struct {
	context *cue.Context
	panels  *cueDefs
	queries *cueDefs
}

func (s *sch) GetLoaders() []Loader {
	return []Loader{s.panels, s.queries}
}

// ValidatePanels verify a list of panels.
// The panels are matched against the known list of CUE definitions (schemas).
// If no schema matches for at least 1 panel, the validation fails.
func (s *sch) ValidatePanels(panels map[string]json.RawMessage) error {
	// go through the panels list
	// the processing stops as soon as it detects an invalid panel -> TODO: improve this to return a list of all the errors encountered ?
	for panelName, panelJSON := range panels {
		logrus.Tracef("Panel to validate: %s", string(panelJSON))

		// compile the JSON panel into a CUE Value
		value := s.context.CompileBytes(panelJSON)

		// retrieve the corresponding panel schema
		panelSchema, err := retrieveSchemaForKind(panelName, value, kindField, s.panels.schemas)
		if err != nil {
			return err
		}
		logrus.Tracef("Panel schema to use: %+v", panelSchema.LookupPath(cue.ParsePath(panelDefPath)))
		finalSchema := panelSchema

		// retrieve the corresponding query schema
		// the wrapping `if` tackles the particular case of panels without a datasource (e.g text panel)
		if lookupPathErr := panelSchema.LookupPath(cue.ParsePath(panelDatasourcePath)).Err(); lookupPathErr == nil {
			querySchema, retrieveErr := retrieveSchemaForKind(panelName, value, fmt.Sprintf("%s.%s", datasourceField, kindField), s.queries.schemas)
			if retrieveErr != nil {
				return retrieveErr
			}
			logrus.Tracef("Query schema to use: %+v", querySchema.LookupPath(cue.ParsePath(queryDefPath)))

			// unify panel and query schemas
			finalSchema = panelSchema.Unify(querySchema)
			if finalSchema.Err() != nil {
				logrus.WithError(finalSchema.Err()).Errorf("Error unifying panel and query schemas to validate panel %s", panelName)
				continue
			}
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
			return err
		}
	}
	logrus.Debug("All panels are valid")
	return nil
}
