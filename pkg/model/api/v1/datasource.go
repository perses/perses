// Copyright 2021 The Perses Authors
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
	"fmt"

	"github.com/perses/perses/pkg/model/api/v1/datasource"
	"gopkg.in/yaml.v2"
)

func GenerateGlobalDatasourceID(name string) string {
	return fmt.Sprintf("/globaldatasources/%s", name)
}

func GenerateDatasourceID(project string, name string) string {
	return generateProjectResourceID("datasources", project, name)
}

type DatasourceSpec interface {
	GetKind() datasource.Kind
}

func unmarshalDatasourceSpec(spec map[string]interface{}, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) (DatasourceSpec, error) {
	if specKind, ok := spec["kind"]; !ok {
		return nil, fmt.Errorf("attribute 'kind' not found in 'datasource.spec'")
	} else {
		rawSpec, err := staticMarshal(spec)
		if err != nil {
			return nil, err
		}
		var result DatasourceSpec
		switch specKind {
		case string(datasource.PrometheusKind):
			result = &datasource.Prometheus{}
		}
		if err := staticUnmarshal(rawSpec, result); err != nil {
			return nil, err
		}
		return result, nil
	}
}

type tmpGlobalDatasource struct {
	Kind     Kind                   `json:"kind" yaml:"kind"`
	Metadata Metadata               `json:"metadata" yaml:"metadata"`
	Spec     map[string]interface{} `json:"spec" yaml:"spec"`
}

// GlobalDatasource is the struct representing the datasource shared to everybody.
// Any Dashboard can reference it.
type GlobalDatasource struct {
	Kind     Kind           `json:"kind" yaml:"kind"`
	Metadata Metadata       `json:"metadata" yaml:"metadata"`
	Spec     DatasourceSpec `json:"spec" yaml:"spec"`
}

func (d *GlobalDatasource) GenerateID() string {
	return GenerateGlobalDatasourceID(d.Metadata.Name)
}

func (d *GlobalDatasource) GetMetadata() interface{} {
	return &d.Metadata
}

func (d *GlobalDatasource) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(spec interface{}) error {
		return json.Unmarshal(data, spec)
	}
	return d.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (d *GlobalDatasource) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return d.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (d *GlobalDatasource) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmp tmpGlobalDatasource
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if tmp.Kind != KindGlobalDatasource {
		return fmt.Errorf("invalid kind: %q for a GlobalDatasource type", tmp.Kind)
	}
	d.Kind = tmp.Kind
	d.Metadata = tmp.Metadata
	if spec, err := unmarshalDatasourceSpec(tmp.Spec, staticMarshal, staticUnmarshal); err != nil {
		return err
	} else {
		d.Spec = spec
	}
	return nil
}

type tmpDatasource struct {
	Kind     Kind                   `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata        `json:"metadata" yaml:"metadata"`
	Spec     map[string]interface{} `json:"spec" yaml:"spec"`
}

// Datasource will be the datasource you can define in your project/namespace
// This is a resource that won't be shared across projects.
// A Dashboard can use it only if it is in the same project.
type Datasource struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     DatasourceSpec  `json:"spec" yaml:"spec"`
}

func (d *Datasource) GenerateID() string {
	return GenerateDatasourceID(d.Metadata.Project, d.Metadata.Name)
}

func (d *Datasource) GetMetadata() interface{} {
	return &d.Metadata
}

func (d *Datasource) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(spec interface{}) error {
		return json.Unmarshal(data, spec)
	}
	return d.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (d *Datasource) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return d.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (d *Datasource) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmp tmpDatasource
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if tmp.Kind != KindDatasource {
		return fmt.Errorf("invalid kind: %q for a Datasource type", tmp.Kind)
	}
	d.Kind = tmp.Kind
	d.Metadata = tmp.Metadata
	if spec, err := unmarshalDatasourceSpec(tmp.Spec, staticMarshal, staticUnmarshal); err != nil {
		return err
	} else {
		d.Spec = spec
	}
	return nil
}
