// Copyright 2024 The Perses Authors
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

package v1

import (
	"encoding/json"
	"errors"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
)

const PluginModuleKind = "PluginModule"

type PluginModule struct {
	Kind     string                `json:"kind" yaml:"kind"`
	Metadata plugin.ModuleMetadata `json:"metadata" yaml:"metadata"`
	Spec     plugin.ModuleSpec     `json:"spec" yaml:"spec"`
	Status   *plugin.ModuleStatus  `json:"status,omitempty" yaml:"status,omitempty"`
}

type PluginInDevelopment struct {
	// The name of the plugin in development
	Name string `json:"name" yaml:"name"`
	// DisableSchema is used to disable the schema validation of the plugin.
	// It is useful when the plugin is in development and the schema is not yet defined.
	DisableSchema bool `json:"disable_schema,omitempty" yaml:"disable_schema,omitempty"`
	// The URL of the development server hosting the plugin.
	// It is usually created by the command `rsbuild dev`.
	// If defined, it will override the URL defined in the `PluginDevEnvironment`.
	URL *common.URL `json:"url,omitempty" yaml:"url,omitempty"`
	// The absolute path to the plugin repository
	AbsolutePath string `json:"absolute_path" yaml:"absolute_path"`
}

func (p *PluginInDevelopment) UnmarshalJSON(data []byte) error {
	var tmp PluginInDevelopment
	type plain PluginInDevelopment
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PluginInDevelopment) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PluginInDevelopment
	type plain PluginInDevelopment
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PluginInDevelopment) validate() error {
	if len(p.Name) == 0 {
		return errors.New("the name of the plugin in development must be set")
	}
	if len(p.AbsolutePath) == 0 && !p.DisableSchema {
		return errors.New("the absolute path of the plugin in development must be set to load the schema. Disable the schema if you don't want to load it")
	}
	return nil
}

type PluginInDevelopment struct {
	// The name of the plugin in development
	Name string `json:"name" yaml:"name"`
	// DisableSchema is used to disable the schema validation of the plugin.
	// It is useful when the plugin is in development and the schema is not yet defined.
	DisableSchema bool `json:"disable_schema,omitempty" yaml:"disable_schema,omitempty"`
	// The URL of the development server hosting the plugin.
	// It is usually created by the command `rsbuild dev`.
	// If defined, it will override the URL defined in the `PluginDevEnvironment`.
	URL *common.URL `json:"url,omitempty" yaml:"url,omitempty"`
	// The absolute path to the plugin repository
	AbsolutePath string `json:"absolute_path" yaml:"absolute_path"`
}

func (p *PluginInDevelopment) UnmarshalJSON(data []byte) error {
	var tmp PluginInDevelopment
	type plain PluginInDevelopment
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PluginInDevelopment) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PluginInDevelopment
	type plain PluginInDevelopment
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PluginInDevelopment) validate() error {
	if len(p.Name) == 0 {
		return errors.New("the name of the plugin in development must be set")
	}
	if len(p.AbsolutePath) == 0 && !p.DisableSchema {
		return errors.New("the absolute path of the plugin in development must be set to load the schema. Disable the schema if you don't want to load it")
	}
	return nil
}
