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
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"strings"

	"cuelang.org/go/cue/build"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
)

// TODO Put in common with percli plugin lint command.
func isPackageModel(file string) (bool, error) {
	data, err := os.ReadFile(file)
	if err != nil {
		return false, err
	}
	return strings.Contains(string(data), "package model"), nil
}

func findPlugin(plugins []plugin.Plugin, kind string) *plugin.Plugin {
	for _, p := range plugins {
		if p.Spec.Name == kind {
			return &p
		}
	}
	return nil
}

type Schema interface {
	Load(pluginPath string, module v1.PluginModule) error
}

func New() Schema {
	return &schema{
		datasources: make(map[string]*build.Instance),
		queries:     make(map[string]*build.Instance),
		variables:   make(map[string]*build.Instance),
		panels:      make(map[string]*build.Instance),
	}
}

type schema struct {
	Schema
	datasources map[string]*build.Instance
	queries     map[string]*build.Instance
	variables   map[string]*build.Instance
	panels      map[string]*build.Instance
}

func (s *schema) Load(pluginPath string, module v1.PluginModule) error {
	return filepath.WalkDir(filepath.Join(pluginPath, module.Spec.SchemasPath), func(currentPath string, d fs.DirEntry, err error) error {
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
		currentDir, _ := path.Split(currentPath)
		kind, instance, schemaErr := LoadModelSchema(currentDir)
		if schemaErr != nil {
			return schemaErr
		}
		pl := findPlugin(module.Spec.Plugins, kind)
		if pl == nil {
			return fmt.Errorf("unable to find the plugin with the associated schema with kind %s", kind)
		}
		switch pl.Kind {
		case plugin.KindDatasource:
			s.datasources[kind] = instance
		case plugin.KindTimeSeriesQuery:
			s.queries[kind] = instance
		case plugin.KindVariable:
			s.variables[kind] = instance
		case plugin.KindPanel:
			s.panels[kind] = instance
		default:
			return fmt.Errorf("unknown kind %s", pl.Kind)
		}
		return fs.SkipDir
	})
}
