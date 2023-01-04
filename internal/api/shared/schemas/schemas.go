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
	"fmt"
	"sync"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/errors"
	"github.com/perses/perses/internal/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/sirupsen/logrus"
)

//go:embed base_def_query.cue
var baseQueryDef []byte

//go:embed query_disjunction_generator.cue
var queryDisjunctionGenerator []byte

var cueValidationOptions = []cue.Option{
	cue.Concrete(true),
	cue.Attributes(true),
	cue.Definitions(true),
	cue.Hidden(true),
}

// retrieveSchemaForKind returns the schema corresponding to the provided kind
func retrieveSchemaForKind(modelKind, modelName string, panelVal cue.Value, kindPath string, schemasMap *sync.Map) (cue.Value, error) {
	// retrieve the value of the Kind field
	kind, err := panelVal.LookupPath(cue.ParsePath(kindPath)).String()
	if err != nil {
		err = fmt.Errorf("invalid %s %s: %s", modelKind, modelName, err) // enrich the error message returned by cue lib
		logrus.Debug(err)
		return cue.Value{}, err
	}

	// retrieve the corresponding schema
	schema, ok := schemasMap.Load(kind)
	if !ok {
		err := fmt.Errorf("invalid %s %s: Unknown %s %s", modelKind, modelName, kindPath, kind)
		logrus.Debug(err)
		return cue.Value{}, err
	}

	return schema.(cue.Value), nil
}

type Schemas interface {
	ValidateDatasource(plugin common.Plugin) error
	ValidatePanels(panels map[string]*modelV1.Panel) error
	ValidatePanel(plugin common.Plugin, panelName string) error
	ValidateVariables([]dashboard.Variable) error
	ValidateVariable(plugin common.Plugin, varName string) error
	GetLoaders() []Loader
}

func New(conf config.Schemas) (Schemas, error) {
	ctx := cuecontext.New()

	// compile the base definitions
	baseQueryDefVal := ctx.CompileBytes(baseQueryDef)
	s := &sch{context: ctx}
	var loaders []Loader
	if len(conf.PanelsPath) != 0 {
		panels := &cueDefs{
			context:     ctx,
			schemas:     &sync.Map{},
			schemasPath: conf.PanelsPath,
			kindCuePath: "kind",
		}
		loaders = append(loaders, panels)
		s.panels = panels
	}
	if len(conf.QueriesPath) != 0 {
		queries := &cueDefsWithDisjunction{
			cueDefs: cueDefs{
				context:     ctx,
				baseDef:     &baseQueryDefVal,
				schemas:     &sync.Map{},
				schemasPath: conf.QueriesPath,
				kindCuePath: "spec.plugin.kind",
			},
			disjSchema: cue.Value{},
			mapID:      "#query_types",
		}
		loaders = append(loaders, queries)
		s.queries = queries
	}
	if len(conf.DatasourcesPath) != 0 {
		dts := &cueDefs{
			context:     ctx,
			schemas:     &sync.Map{},
			schemasPath: conf.DatasourcesPath,
			kindCuePath: "kind",
		}
		loaders = append(loaders, dts)
		s.dts = dts
	}
	if len(conf.VariablesPath) != 0 {
		vars := &cueDefs{
			context:     ctx,
			schemas:     &sync.Map{},
			schemasPath: conf.VariablesPath,
			kindCuePath: "kind",
		}
		loaders = append(loaders, vars)
		s.vars = vars
	}
	s.loaders = loaders
	if err := s.init(); err != nil {
		return nil, err
	}
	return s, nil
}

type sch struct {
	Schemas
	context *cue.Context
	panels  *cueDefs
	dts     *cueDefs
	vars    *cueDefs
	queries *cueDefsWithDisjunction
	loaders []Loader
}

func (s *sch) GetLoaders() []Loader {
	return s.loaders
}

func (s *sch) ValidateDatasource(plugin common.Plugin) error {
	if s.dts == nil {
		logrus.Warning("datasource schemas are not loaded")
		return nil
	}
	return s.validatePlugin(plugin, "datasource", "", s.dts, func(originalValue cue.Value) cue.Value {
		return originalValue
	})
}

// ValidatePanels verify a list of panels.
// The panels are matched against the known list of CUE definitions (schemas).
// If no schema matches for at least 1 panel, the validation fails.
func (s *sch) ValidatePanels(panels map[string]*modelV1.Panel) error {
	if s.panels == nil {
		logrus.Warning("panel schemas are not loaded")
		return nil
	}
	// go through the panels list
	// the processing stops as soon as it detects an invalid panel -> TODO: improve this to return a list of all the errors encountered ?
	for panelName, panel := range panels {
		logrus.Tracef("Panel to validate: %s", panelName)
		if err := s.ValidatePanel(panel.Spec.Plugin, panelName); err != nil {
			return err
		}
	}
	logrus.Debug("All panels are valid")
	return nil
}

func (s *sch) ValidatePanel(plugin common.Plugin, panelName string) error {
	return s.validatePlugin(plugin, "panel", panelName, s.panels, func(originalValue cue.Value) cue.Value {
		if s.queries != nil {
			// Then merge with the queries disjunction schema
			return originalValue.Unify(s.queries.disjSchema)
		}
		return originalValue
	})
}

// ValidateVariables verify a list of variables.
// The variables are matched against the known list of CUE definitions (schemas)
// This applies to the ListVariable type only (TextVariable is skipped)
// If no schema matches for at least 1 variable, the validation fails.
func (s *sch) ValidateVariables(variables []dashboard.Variable) error {
	if s.vars == nil {
		logrus.Warning("variable schemas are not loaded")
		return nil
	}
	// go through the variables list
	// the processing stops as soon as it detects an invalid variable  -> TODO: improve this to return a list of all the errors encountered ?
	for _, variable := range variables {
		// skip if this is not a ListVariable (no validation needed in this case)
		if variable.Kind != dashboard.ListVariable {
			continue
		}
		// convert the variable's spec to ListVariableSpec
		listVariableSpec, ok := variable.Spec.(*dashboard.ListVariableSpec)
		if !ok {
			return errors.New("Error converting Variable to ListVariable")
		}
		variableName := listVariableSpec.GetName()
		logrus.Tracef("Variable to validate: %s", variableName)
		if err := s.ValidateVariable(listVariableSpec.Plugin, variableName); err != nil {
			return err
		}
	}
	logrus.Debug("All variables are valid")
	return nil
}

func (s *sch) ValidateVariable(plugin common.Plugin, variableName string) error {
	return s.validatePlugin(plugin, "variable", variableName, s.vars, func(originalValue cue.Value) cue.Value {
		return originalValue
	})
}

func (s *sch) validatePlugin(plugin common.Plugin, modelKind string, modelName string, cueDefs *cueDefs, enrichSchema func(originalValue cue.Value) cue.Value) error {
	pluginData, err := plugin.JSONMarshal()
	if err != nil {
		logrus.WithError(err).Debugf("unable to marshal the plugin %q", plugin.Kind)
		return err
	}
	// compile the JSON plugin into a CUE Value
	value := s.context.CompileBytes(pluginData)

	// retrieve the corresponding schema
	pluginSchema, err := retrieveSchemaForKind(modelKind, modelName, value, cueDefs.kindCuePath, cueDefs.schemas)
	if err != nil {
		return err
	}

	pluginSchema = enrichSchema(pluginSchema)
	if pluginSchema.Err() != nil {
		logrus.WithError(pluginSchema.Err()).Errorf("Error enriching %s schema", modelKind)
		return pluginSchema.Err()
	}

	unified := value.Unify(pluginSchema)
	err = unified.Validate(cueValidationOptions...)
	if err != nil {
		logrus.Debug(errors.Details(err, nil))
		//TODO: return errors.Details(err, nil) to get a more meaningful error, but should be cleaned of line numbers & server file paths!
		err = fmt.Errorf("invalid %s %s: %s", modelKind, modelName, err) // enrich the error message returned by cue lib
		return err
	}
	return nil
}

func (s *sch) init() error {
	for _, l := range s.loaders {
		if err := l.Load(); err != nil {
			return err
		}
	}
	return nil
}
