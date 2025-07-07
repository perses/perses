// Copyright 2025 The Perses Authors
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

	"cuelang.org/go/cue/build"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/perses/perses/pkg/model/api/v1/variable"
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
		name, instance, schemaErr := LoadModelSchema(currentDir)
		if schemaErr != nil {
			return schemaErr
		}
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
	ValidateDatasource(plugin common.Plugin, dtsName string) error
	ValidatePanels(panels map[string]*v1.Panel) error
	ValidatePanel(plugin common.Plugin, panelName string) error
	ValidateGlobalVariable(v v1.VariableSpec) error
	ValidateDashboardVariables([]dashboard.Variable) error
	ValidateVariable(plugin common.Plugin, varName string) error
	GetDatasourceSchema(pluginName string) (*build.Instance, error)
}

func New() Schema {
	return &completeSchema{
		sch: &sch{
			datasources: make(map[string]*build.Instance),
			queries:     make(map[string]*build.Instance),
			variables:   make(map[string]*build.Instance),
			panels:      make(map[string]*build.Instance),
		},
		devSch: &sch{
			datasources: make(map[string]*build.Instance),
			queries:     make(map[string]*build.Instance),
			variables:   make(map[string]*build.Instance),
			panels:      make(map[string]*build.Instance),
		},
	}
}

type completeSchema struct {
	Schema
	sch    *sch
	devSch *sch
}

func (s *completeSchema) Load(pluginPath string, module v1.PluginModule) error {
	return s.sch.load(pluginPath, module)
}

func (s *completeSchema) LoadDevPlugin(pluginPath string, module v1.PluginModule) error {
	return s.devSch.load(pluginPath, module)
}

func (s *completeSchema) ValidateDatasource(plugin common.Plugin, dtsName string) error {
	if _, ok := s.devSch.datasources[plugin.Kind]; ok {
		return s.devSch.validateDatasource(plugin, dtsName)
	}
	return s.sch.validateDatasource(plugin, dtsName)
}

// ValidatePanels verify a list of panels.
// The panels are matched against the known list of CUE definitions (schemas).
// If no schema matches for at least 1 panel, the validation fails.
func (s *completeSchema) ValidatePanels(panels map[string]*v1.Panel) error {
	if len(s.devSch.panels) == 0 && len(s.sch.panels) == 0 {
		return fmt.Errorf("panel schemas are not loaded")
	}
	// go through the panels list
	// the processing stops as soon as it detects an invalid panel -> TODO: improve this to return a list of all the errors encountered ?
	for panelName, panel := range panels {
		logrus.Tracef("Panel to validate: %s", panelName)
		if err := s.ValidatePanel(panel.Spec.Plugin, panelName); err != nil {
			return err
		}
		for i, query := range panel.Spec.Queries {
			if err := s.validateQuery(query.Spec.Plugin, fmt.Sprintf("n°%d", i+1)); err != nil {
				return err
			}
		}
	}
	logrus.Debug("All panels are valid")
	return nil
}

func (s *completeSchema) ValidatePanel(plugin common.Plugin, panelName string) error {
	if _, ok := s.devSch.panels[plugin.Kind]; ok {
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
			return errors.New("error converting Variable to ListVariable")
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

func (s *completeSchema) ValidateVariable(plugin common.Plugin, varName string) error {
	if _, ok := s.devSch.panels[plugin.Kind]; ok {
		return s.devSch.validateVariable(plugin, varName)
	}
	return s.sch.validateVariable(plugin, varName)
}

func (s *completeSchema) GetDatasourceSchema(pluginName string) (*build.Instance, error) {
	if _, ok := s.devSch.datasources[pluginName]; ok {
		return s.devSch.getDatasourceSchema(pluginName)
	}
	return s.sch.getDatasourceSchema(pluginName)
}

func (s *completeSchema) validateQuery(plugin common.Plugin, queryName string) error {
	if _, ok := s.devSch.queries[plugin.Kind]; ok {
		return s.devSch.validateQuery(plugin, queryName)
	}
	return s.sch.validateQuery(plugin, queryName)
}

type sch struct {
	datasources map[string]*build.Instance
	queries     map[string]*build.Instance
	variables   map[string]*build.Instance
	panels      map[string]*build.Instance
}

func (s *sch) load(pluginPath string, module v1.PluginModule) error {
	schemas, err := Load(pluginPath, module.Spec)
	if err != nil {
		return err
	}
	for _, schema := range schemas {
		switch schema.Kind {
		case plugin.KindDatasource:
			s.datasources[schema.Name] = schema.Instance
		case plugin.KindTimeSeriesQuery, plugin.KindTraceQuery, plugin.KindProfileQuery:
			s.queries[schema.Name] = schema.Instance
		case plugin.KindVariable:
			s.variables[schema.Name] = schema.Instance
		case plugin.KindPanel:
			s.panels[schema.Name] = schema.Instance
		default:
			return fmt.Errorf("unknown kind %s", schema.Kind)
		}
	}

	return nil
}

func (s *sch) validateDatasource(plugin common.Plugin, dtsName string) error {
	if len(s.datasources) == 0 {
		return fmt.Errorf("datasource schemas are not loaded")
	}
	return validatePlugin(plugin, s.datasources[plugin.Kind], "datasource", dtsName)
}

func (s *sch) validatePanel(plugin common.Plugin, panelName string) error {
	if s.panels == nil {
		return fmt.Errorf("panel schemas are not loaded")
	}
	return validatePlugin(plugin, s.panels[plugin.Kind], "panel", panelName)
}

func (s *sch) validateQuery(plugin common.Plugin, queryName string) error {
	if s.queries == nil {
		return fmt.Errorf("query schemas are not loaded")
	}
	return validatePlugin(plugin, s.queries[plugin.Kind], "query", queryName)
}

func (s *sch) validateVariable(plugin common.Plugin, variableName string) error {
	if len(s.variables) == 0 {
		return fmt.Errorf("variable schemas are not loaded")
	}
	return validatePlugin(plugin, s.variables[plugin.Kind], "variable", variableName)
}

func (s *sch) getDatasourceSchema(pluginName string) (*build.Instance, error) {
	if len(s.datasources) == 0 {
		return nil, fmt.Errorf("datasource schemas are not loaded")
	}
	instance, ok := s.datasources[pluginName]
	if !ok {
		return nil, fmt.Errorf("datasource schema not found for plugin %s", pluginName)
	}
	return instance, nil
}
