// Copyright 2023 The Perses Authors
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
	"os"
	"path/filepath"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/errors"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"github.com/sirupsen/logrus"
)

const kindPath = "kind"

//go:embed base_def_query.cue
var baseQueryDef []byte

var cueValidationOptions = []cue.Option{
	cue.Concrete(true),
	cue.Attributes(true),
	cue.Definitions(true),
	cue.Hidden(true),
}

// retrieveSchemaForKind returns the schema corresponding to the provided kind
func retrieveSchemaForKind(modelKind, modelName string, panelVal cue.Value, schemasMap map[string]cue.Value) (cue.Value, error) {
	// retrieve the value of the Kind field
	kind, err := panelVal.LookupPath(cue.ParsePath(kindPath)).String()
	if err != nil {
		err = fmt.Errorf("invalid %s %s: %s", modelKind, modelName, err) // enrich the error message returned by cue lib
		logrus.Debug(err)
		return cue.Value{}, err
	}

	// retrieve the corresponding schema
	schema, ok := schemasMap[kind]
	if !ok {
		err := fmt.Errorf("invalid %s %s: Unknown %s %s", modelKind, modelName, kindPath, kind)
		logrus.Debug(err)
		return cue.Value{}, err
	}

	return schema, nil
}

func validatePlugin(plugin common.Plugin, modelKind string, modelName string, cueDefs *cueDefs) error {
	pluginData, err := plugin.JSONMarshal()
	if err != nil {
		logrus.WithError(err).Debugf("unable to marshal the plugin %q", plugin.Kind)
		return err
	}
	// compile the JSON plugin into a CUE Value
	cueContext := cueDefs.context.Load()
	if cueContext == nil {
		return fmt.Errorf("unable to validate the plugin %q %q, associated cue context not created", modelKind, modelName)
	}
	value := cueContext.CompileBytes(pluginData)

	// retrieve the corresponding schema
	schemas := cueDefs.schemas.Load()
	if schemas == nil {
		return fmt.Errorf("unable to validate the plugin %q %q, associated cue definition not loaded", modelKind, modelName)
	}
	pluginSchema, err := retrieveSchemaForKind(modelKind, modelName, value, *schemas)
	if err != nil {
		return err
	}

	unified := value.Unify(pluginSchema)
	err = unified.Validate(cueValidationOptions...)
	if err != nil {
		// retrieve the full error detail to provide better insights to the end user:
		ex, errOs := os.Executable()
		if errOs != nil {
			logrus.WithError(errOs).Error("Error retrieving exec path to build CUE error detail")
		}
		fullErrStr := errors.Details(err, &errors.Config{Cwd: filepath.Dir(ex)})
		logrus.Debug(fullErrStr)

		return fmt.Errorf("invalid %s %s: %s", modelKind, modelName, fullErrStr)
	}
	return nil
}

func getSchema(modelKind string, pluginKindName string, cueDefs *cueDefs) (cue.Value, error) {
	if cueDefs == nil {
		return cue.Value{}, fmt.Errorf("no %s schema available", modelKind)
	}
	schemas := cueDefs.schemas.Load()
	if schemas == nil {
		return cue.Value{}, fmt.Errorf("no %s schema available", modelKind)
	}
	schema, ok := (*schemas)[pluginKindName]
	if !ok {
		return cue.Value{}, fmt.Errorf("%s schema %q doesn't exist", modelKind, pluginKindName)
	}
	return schema, nil
}

type Schemas interface {
	ValidateDatasource(plugin common.Plugin, dtsName string) error
	ValidatePanels(panels map[string]*modelV1.Panel) error
	ValidatePanel(plugin common.Plugin, panelName string) error
	ValidateGlobalVariable(v modelV1.VariableSpec) error
	ValidateDashboardVariables([]dashboard.Variable) error
	ValidateVariable(plugin common.Plugin, varName string) error
	GetLoaders() []Loader
	GetDatasourceSchema(pluginName string) (cue.Value, error)
}

func New(conf config.Schemas) (Schemas, error) {
	ctx := cuecontext.New()

	// compile the base definitions
	baseQueryDefVal := ctx.CompileBytes(baseQueryDef)
	s := &sch{}
	var loaders []Loader
	if len(conf.PanelsPath) != 0 {
		panels := &cueDefs{
			schemasPath: conf.PanelsPath,
		}
		loaders = append(loaders, panels)
		s.panels = panels
	}
	if len(conf.QueriesPath) != 0 {
		queries := &cueDefs{
			baseDef:     &baseQueryDefVal,
			schemasPath: conf.QueriesPath,
		}
		loaders = append(loaders, queries)
		s.queries = queries
	}
	if len(conf.DatasourcesPath) != 0 {
		dts := &cueDefs{
			schemasPath: conf.DatasourcesPath,
		}
		loaders = append(loaders, dts)
		s.dts = dts
	}
	if len(conf.VariablesPath) != 0 {
		vars := &cueDefs{
			schemasPath: conf.VariablesPath,
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
	panels  *cueDefs
	dts     *cueDefs
	vars    *cueDefs
	queries *cueDefs
	loaders []Loader
}

func (s *sch) GetLoaders() []Loader {
	return s.loaders
}

func (s *sch) GetDatasourceSchema(pluginName string) (cue.Value, error) {
	return getSchema("datasource", pluginName, s.dts)
}

func (s *sch) ValidateDatasource(plugin common.Plugin, dtsName string) error {
	if s.dts == nil {
		logrus.Warning("datasource schemas are not loaded")
		return nil
	}
	return validatePlugin(plugin, "datasource", dtsName, s.dts)
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
		for i, query := range panel.Spec.Queries {
			if err := s.ValidateQuery(query.Spec.Plugin, fmt.Sprintf("n°%d", i+1)); err != nil {
				return err
			}
		}
	}
	logrus.Debug("All panels are valid")
	return nil
}

func (s *sch) ValidatePanel(plugin common.Plugin, panelName string) error {
	if s.panels == nil {
		logrus.Warning("panel schemas are not loaded")
		return nil
	}
	return validatePlugin(plugin, "panel", panelName, s.panels)
}

func (s *sch) ValidateQuery(plugin common.Plugin, queryName string) error {
	if s.queries == nil {
		logrus.Warning("query schemas are not loaded")
		return nil
	}
	return validatePlugin(plugin, "query", queryName, s.queries)
}

func (s *sch) ValidateGlobalVariable(v modelV1.VariableSpec) error {
	if v.Kind != variable.KindList {
		return nil
	}

	listVariableSpec, ok := v.Spec.(*variable.ListSpec)
	if !ok {
		return errors.New("Error converting Variable to ListVariable")
	}
	return s.ValidateVariable(listVariableSpec.Plugin, "")
}

// ValidateDashboardVariables verify a list of variables defined in a dashboard.
// The variables are matched against the known list of CUE definitions (schemas)
// This applies to the ListVariable type only (TextVariable is skipped as there are no plugins for this kind)
// If no schema matches for at least 1 variable, the validation fails.
func (s *sch) ValidateDashboardVariables(variables []dashboard.Variable) error {
	if s.vars == nil {
		logrus.Warning("variable schemas are not loaded")
		return nil
	}
	// go through the variables list
	// the processing stops as soon as it detects an invalid variable  -> TODO: improve this to return a list of all the errors encountered ?
	for _, v := range variables {
		// skip if this is not a ListVariable (no validation needed in this case)
		if v.Kind != variable.KindList {
			continue
		}
		// convert the variable's spec to ListVariableSpec
		listVariableSpec, ok := v.Spec.(*dashboard.ListVariableSpec)
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
	if s.vars == nil {
		logrus.Warning("variable schemas are not loaded")
		return nil
	}
	return validatePlugin(plugin, "variable", variableName, s.vars)
}

func (s *sch) init() error {
	return RunLoaders(s.loaders, Model, Full)
}

func RunLoaders(loaders []Loader, schemaType SchemaType, loadType LoadType) error {
	totalSuccessfulLoads := 0
	totalFailedLoads := 0
	for _, l := range loaders {
		successfulLoads, failedLoads, err := l.Load()
		totalSuccessfulLoads += successfulLoads
		totalFailedLoads += failedLoads
		if err != nil {
			return err
		}
	}
	MonitorLoadAttempts(totalSuccessfulLoads, totalFailedLoads, schemaType, loadType)
	return nil
}
