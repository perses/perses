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

package config

import (
	"path/filepath"

	"github.com/perses/common/config"
	"github.com/perses/perses/internal/cli/file"
)

const (
	DefaultConfigFile = "perses_plugin_config.yaml"
)

type PluginConfig struct {
	// DistPath is the path to the folder containing the files built by npm
	DistPath string `json:"dist_path" yaml:"dist_path"`
	// FrontendPath is the path to the folder containing the package.json file
	FrontendPath string `json:"frontend_path" yaml:"frontend_path"`
	// SchemasPath is the path to the folder containing the cuelang schema
	SchemasPath string `json:"schemas_path" yaml:"schemas_path"`
}

func (c *PluginConfig) Verify() error {
	if len(c.DistPath) == 0 {
		c.DistPath = "dist"
	}
	if c.SchemasPath == "" {
		c.SchemasPath = "schemas"
	}
	return nil
}

func Resolve(pluginPath string, configFile string) (PluginConfig, error) {
	cfgPath := configFile
	c := PluginConfig{}
	if len(cfgPath) == 0 {
		if exist, err := file.Exists(filepath.Join(pluginPath, DefaultConfigFile)); err == nil && exist {
			cfgPath = DefaultConfigFile
		}
	}
	if len(cfgPath) != 0 {
		// We are appending the plugin path to the config file path only if the config file exists and has been found.
		// Otherwise, if only the plugin path is provided,
		// and the configFile is empty and the default one is not found, the config resolver will throw an error, which is not something we want in this case.
		cfgPath = filepath.Join(pluginPath, cfgPath)
	}
	return c, config.NewResolver[PluginConfig]().
		SetConfigFile(cfgPath).
		SetEnvPrefix("PERSES_PLUGIN_CONFIG").
		Resolve(&c).
		Verify()
}
