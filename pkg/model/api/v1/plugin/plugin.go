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

package plugin

import (
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/model/api/v1/common"
)

const (
	KindVariable        = "Variable"
	KindDatasource      = "Datasource"
	KindPanel           = "Panel"
	KindTimeSeriesQuery = "TimeSeriesQuery"
	KindQuery           = "Query"
)

type Spec struct {
	Display *common.Display `json:"display" yaml:"display"`
	Name    string          `json:"name" yaml:"name"`
}

type Plugin struct {
	Kind string `json:"kind" yaml:"kind"`
	Spec Spec   `json:"spec" yaml:"spec"`
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

func (p *Plugin) UnmarshalYAML(unmarshal func(interface{}) error) error {
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
	if p.Kind != KindVariable && p.Kind != KindDatasource &&
		p.Kind != KindPanel && p.Kind != KindTimeSeriesQuery {
		return fmt.Errorf("invalid plugin kind %s", p.Kind)
	}
	return nil
}

type ModuleSpec struct {
	SchemasPath string   `json:"schemasPath" yaml:"schemasPath"`
	Plugins     []Plugin `json:"plugins" yaml:"plugins"`
}

func (m *ModuleSpec) UnmarshalJSON(data []byte) error {
	var tmp ModuleSpec
	type plain ModuleSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func (m *ModuleSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp ModuleSpec
	type plain ModuleSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func (m *ModuleSpec) validate() error {
	if len(m.Plugins) == 0 {
		return fmt.Errorf("the module spec must have at least one plugin")
	}
	if len(m.SchemasPath) == 0 {
		m.SchemasPath = "schemas"
	}
	return nil
}

type ModuleMetadata struct {
	Name    string `json:"name" yaml:"name"`
	Version string `json:"version" yaml:"version"`
}
