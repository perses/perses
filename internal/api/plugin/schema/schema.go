// Copyright The Perses Authors
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

package schema

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"cuelang.org/go/cue/build"
	"github.com/perses/perses/internal/api/plugin/tree"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/perses/spec/go/common"
	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/dashboard/variable"
	"github.com/sirupsen/logrus"
)

type LoadSchema struct {
	Kind     plugin.Kind
	Name     string
	Instance *build.Instance
}

// Load is loading the list of the schema associated with the given plugin module.
func Load(pluginPath string, moduleSpec plugin.ModuleSpec) ([]LoadSchema, error) {
	var schemas []LoadSchema
	err := filepath.WalkDir(filepath.Join(pluginPath, moduleSpec.SchemasPath), func(currentPath string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if d.Name() == "migrate" {
				return fs.SkipDir
			}
			return nil
		}
		if filepath.Ext(currentPath) != ".cue" {
			return nil
		}
		if isModel, openFileErr := isPackageModel(currentPath); openFileErr != nil {
			if openFileErr != nil {
				return openFileErr
			}
			if !isModel {
				return nil
			}
		}
		currentDir, _ := filepath.Split(currentPath)
		logrus.Tracef("Loading model package from %s", currentDir)
		// Name is the lowest type level of the plugin. For example, for the Prometheus module, it can return PrometheusTimeseriesQuery.
		// It is called "name" because in the plugin definition located in package.json, this value is present in the `name` field.
		// Example - extract from package.json:
		//       {
		//        "kind": "TimeSeriesQuery",
		//        "spec": {
		//          "display": {
		//            "name": "Prometheus Time Series Query"
		//          },
		//          "name": "PrometheusTimeSeriesQuery"
		//        }
		//      },
		//
		// Besides in the plugin schema, "PrometheusTimeSeriesQuery" is the value of the `kind` field
		// Example - extract from query.cue:
		//
		// kind: "PrometheusTimeSeriesQuery"
		// spec: close({
		//	ds.#selector
		//	query:             strings.MinRunes(1)
		//	seriesNameFormat?: string
		//	minStep?:          =~ds.#durationRegex | =~common.#variableSyntaxRegex
		//	resolution?:       number
		// })
		//
		// #variableSyntaxRegex: "^\\$\\w+$"
		name, instance, schemaErr := LoadModelSchema(currentDir)
		if schemaErr != nil {
			return schemaErr
		}
		// getPlugin is extracting the plugin definition in package.json.
		// So here, with the previous example, pl.kind is equal to `TimeSeriesQuery`
		pl := getPlugin(moduleSpec.Plugins, name)
		if pl == nil {
			return fmt.Errorf("unable to find the plugin with the associated schema with kind %s", name)
		}
		schemas = append(schemas, LoadSchema{
			Kind:     pl.Kind,
			Name:     name,
			Instance: instance,
		})
		return fs.SkipDir
	})
	return schemas, err
}

func isPackageModel(file string) (bool, error) {
	data, err := os.ReadFile(file) //nolint: gosec
	if err != nil {
		return false, err
	}
	return strings.Contains(string(data), "package model"), nil
}

func getPlugin(plugins []plugin.Plugin, kind string) *plugin.Plugin {
	for _, p := range plugins {
		if p.Spec.Name == kind {
			return &p
		}
	}
	return nil
}

type Schema interface {
	Load(pluginPath string, module v1.PluginModule) error
	LoadDevPlugin(pluginPath string, module v1.PluginModule) error
	UnloadDevPlugin(module v1.PluginModule)
	ValidateDatasource(plugin common.Plugin, dtsName string) error
	ValidatePanels(panels map[string]*dashboard.Panel) error
	ValidatePanel(plugin common.Plugin, panelName string) error
	ValidateGlobalVariable(v v1.VariableSpec) error
	ValidateDashboardVariables([]dashboard.Variable) error
	ValidateVariable(plugin common.Plugin, varName string) error
	GetDatasourceSchema(pluginName string) (*build.Instance, error)
}

func New() Schema {
	return &completeSchema{
		sch:    newSch(),
		devSch: newSch(),
	}
}

type completeSchema struct {
	Schema
	sch    *sch
	devSch *sch
	mutex  sync.RWMutex
}

func (s *completeSchema) Load(pluginPath string, module v1.PluginModule) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	return s.sch.load(pluginPath, module)
}

func (s *completeSchema) LoadDevPlugin(pluginPath string, module v1.PluginModule) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	return s.devSch.load(pluginPath, module)
}

func (s *completeSchema) UnloadDevPlugin(module v1.PluginModule) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	for _, p := range module.Spec.Plugins {
		s.devSch.remove(p.Kind, p.Spec.Name, module.Metadata)
	}
}

func (s *completeSchema) ValidateDatasource(plugin common.Plugin, dtsName string) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	if _, ok := s.devSch.datasources.GetWithPluginMetadata(plugin.Kind, plugin.Metadata); ok {
		return s.devSch.validateDatasource(plugin, dtsName)
	}
	return s.sch.validateDatasource(plugin, dtsName)
}

// ValidatePanels verify a list of panels.
// The panels are matched against the known list of CUE definitions (schemas).
// If no schema matches for at least 1 panel, the validation fails.
func (s *completeSchema) ValidatePanels(panels map[string]*dashboard.Panel) error {
	if len(s.devSch.panels) == 0 && len(s.sch.panels) == 0 {
		return fmt.Errorf("panel schemas are not loaded")
	}
	var errs []error
	for panelName, panel := range panels {
		logrus.Tracef("Panel to validate: %s", panelName)
		if err := s.ValidatePanel(panel.Spec.Plugin, panelName); err != nil {
			errs = append(errs, err)
			continue
		}
		for i, query := range panel.Spec.Queries {
			if err := s.validateQuery(query.Spec.Plugin, fmt.Sprintf("n°%d", i+1)); err != nil {
				errs = append(errs, fmt.Errorf("panel %q: %w", panelName, err))
			}
		}
	}
	if len(errs) == 0 {
		logrus.Debug("All panels are valid")
	}
	return errors.Join(errs...)
}

func (s *completeSchema) ValidatePanel(plugin common.Plugin, panelName string) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	if _, ok := s.devSch.panels.GetWithPluginMetadata(plugin.Kind, plugin.Metadata); ok {
		return s.devSch.validatePanel(plugin, panelName)
	}
	return s.sch.validatePanel(plugin, panelName)
}

func (s *completeSchema) ValidateGlobalVariable(v v1.VariableSpec) error {
	if v.Kind != variable.KindList {
		return nil
	}

	listVariableSpec, ok := v.Spec.(*variable.ListSpec)
	if !ok {
		return errors.New("error converting Variable to ListVariable")
	}
	return s.ValidateVariable(listVariableSpec.Plugin, "")
}

// ValidateDashboardVariables verify a list of variables defined in a dashboard.
// The variables are matched against the known list of CUE definitions (schemas)
// This applies to the ListVariable type only (TextVariable is skipped as there are no plugins for this kind)
// If no schema matches for at least 1 variable, the validation fails.
func (s *completeSchema) ValidateDashboardVariables(variables []dashboard.Variable) error {
	if len(s.devSch.variables) == 0 && len(s.sch.variables) == 0 {
		return fmt.Errorf("variable schemas are not loaded")
	}
	var errs []error
	for _, v := range variables {
		// skip if this is not a ListVariable (no validation needed in this case)
		if v.Kind != variable.KindList {
			continue
		}
		// convert the variable's spec to ListVariableSpec
		listVariableSpec, ok := v.Spec.(*dashboard.ListVariableSpec)
		if !ok {
			errs = append(errs, errors.New("error converting Variable to ListVariable"))
			continue
		}
		variableName := listVariableSpec.GetName()
		logrus.Tracef("Variable to validate: %s", variableName)
		if err := s.ValidateVariable(listVariableSpec.Plugin, variableName); err != nil {
			errs = append(errs, err)
		}
	}
	if len(errs) == 0 {
		logrus.Debug("All variables are valid")
	}
	return errors.Join(errs...)
}

func (s *completeSchema) ValidateVariable(plugin common.Plugin, varName string) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	if _, ok := s.devSch.panels.GetWithPluginMetadata(plugin.Kind, plugin.Metadata); ok {
		return s.devSch.validateVariable(plugin, varName)
	}
	return s.sch.validateVariable(plugin, varName)
}

func (s *completeSchema) GetDatasourceSchema(pluginName string) (*build.Instance, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// For the moment, we are only supporting the plugin datasource from the perses registry for the datasource discovery.
	// The discovery is not really well-used and having multiple registries for datasources is not a common use case currently.
	// This hack should be fine for a while.

	if _, ok := s.devSch.datasources.GetWithPluginMetadata(pluginName, nil); ok {
		return s.devSch.getDatasourceSchema(pluginName, nil)
	}
	return s.sch.getDatasourceSchema(pluginName, nil)
}

func (s *completeSchema) validateQuery(plugin common.Plugin, queryName string) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	if _, ok := s.devSch.queries.GetWithPluginMetadata(plugin.Kind, plugin.Metadata); ok {
		return s.devSch.validateQuery(plugin, queryName)
	}
	return s.sch.validateQuery(plugin, queryName)
}

type sch struct {
	datasources tree.Tree[*build.Instance]
	queries     tree.Tree[*build.Instance]
	variables   tree.Tree[*build.Instance]
	panels      tree.Tree[*build.Instance]
}

func newSch() *sch {
	return &sch{
		datasources: make(tree.Tree[*build.Instance]),
		queries:     make(tree.Tree[*build.Instance]),
		variables:   make(tree.Tree[*build.Instance]),
		panels:      make(tree.Tree[*build.Instance]),
	}
}

func (s *sch) load(pluginPath string, module v1.PluginModule) error {
	schemas, err := Load(pluginPath, module.Spec)
	if err != nil {
		return err
	}
	for _, schema := range schemas {
		if schema.Kind.IsQuery() {
			// Here the information about the "super type" of the query (aka TimeSeriesQuery for PrometheusTimeSeriesQuery) disappears.
			// This is a known validation gap yet to be solved: because of this you can currently wrongly pass the validation
			// with e.g the super type `LogQuery` & the plugin implementation `PrometheusTimeSeriesQuery`.
			s.queries.Add(schema.Name, module.Metadata, schema.Instance)
		} else {
			switch schema.Kind {
			case plugin.KindDatasource:
				s.datasources.Add(schema.Name, module.Metadata, schema.Instance)
			case plugin.KindVariable:
				s.variables.Add(schema.Name, module.Metadata, schema.Instance)
			case plugin.KindPanel:
				s.panels.Add(schema.Name, module.Metadata, schema.Instance)
			default:
				return fmt.Errorf("unknown kind %s", schema.Kind)
			}
		}
	}
	return nil
}

func (s *sch) remove(kind plugin.Kind, name string, moduleMetadata plugin.ModuleMetadata) {
	if kind.IsQuery() {
		s.queries.Remove(name, moduleMetadata)
	} else {
		switch kind {
		case plugin.KindDatasource:
			s.datasources.Remove(name, moduleMetadata)
		case plugin.KindVariable:
			s.variables.Remove(name, moduleMetadata)
		case plugin.KindPanel:
			s.panels.Remove(name, moduleMetadata)
		}
	}
}

func (s *sch) validateDatasource(plugin common.Plugin, dtsName string) error {
	if len(s.datasources) == 0 {
		return fmt.Errorf("datasource schemas are not loaded")
	}
	instance, _ := s.datasources.GetWithPluginMetadata(plugin.Kind, plugin.Metadata)
	return validatePlugin(plugin, instance, "datasource", dtsName)
}

func (s *sch) validatePanel(plugin common.Plugin, panelName string) error {
	if s.panels == nil {
		return fmt.Errorf("panel schemas are not loaded")
	}
	instance, _ := s.panels.GetWithPluginMetadata(plugin.Kind, plugin.Metadata)
	return validatePlugin(plugin, instance, "panel", panelName)
}

func (s *sch) validateQuery(plugin common.Plugin, queryName string) error {
	if s.queries == nil {
		return fmt.Errorf("query schemas are not loaded")
	}
	instance, _ := s.queries.GetWithPluginMetadata(plugin.Kind, plugin.Metadata)
	return validatePlugin(plugin, instance, "query", queryName)
}

func (s *sch) validateVariable(plugin common.Plugin, variableName string) error {
	if len(s.variables) == 0 {
		return fmt.Errorf("variable schemas are not loaded")
	}
	instance, _ := s.variables.GetWithPluginMetadata(plugin.Kind, plugin.Metadata)
	return validatePlugin(plugin, instance, "variable", variableName)
}

func (s *sch) getDatasourceSchema(datasourceName string, metadata *common.PluginMetadata) (*build.Instance, error) {
	if len(s.datasources) == 0 {
		return nil, fmt.Errorf("datasource schemas are not loaded")
	}
	instance, ok := s.datasources.GetWithPluginMetadata(datasourceName, metadata)
	if !ok {
		return nil, fmt.Errorf("datasource schema not found for plugin %s", datasourceName)
	}
	return instance, nil
}
