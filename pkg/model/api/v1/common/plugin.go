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

package common

import (
	"encoding/json"
	"fmt"
)

type PluginMetadata struct {
	// Version is optional. If not provided, it means the latest version available in the Perses instance.
	Version string `json:"version,omitempty" yaml:"version,omitempty"`
	// Registry is optional. If not provided, it means the default registry: "perses.dev".
	Registry string `json:"registry,omitempty" yaml:"registry,omitempty"`
}

type Plugin struct {
	// Kind is the type of the plugin (e.g., Panel, Variable, Datasource, etc.).
	Kind string `json:"kind" yaml:"kind"`
	// Metadata is an optional field that contains additional information such as version and registry of the plugin.
	Metadata *PluginMetadata `json:"metadata,omitempty" yaml:"metadata,omitempty"`
	// +kubebuilder:pruning:PreserveUnknownFields
	// +kubebuilder:validation:Schemaless
	Spec any `json:"spec" yaml:"spec"`
}

func (p Plugin) JSONMarshal() ([]byte, error) {
	return json.Marshal(p)
}

func (p *Plugin) UnmarshalJSON(data []byte) error {
	var tmp Plugin
	type plain Plugin
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Plugin) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp Plugin
	type plain Plugin
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Plugin) validate() error {
	if len(p.Kind) == 0 {
		return fmt.Errorf("kind cannot be empty")
	}
	return nil
}
