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

func GenerateDatasourceID(name string) string {
	return fmt.Sprintf("/datasources/%s", name)
}

type DatasourceSpec interface {
	GetKind() datasource.Kind
}

type tmpDatasource struct {
	Kind     Kind                   `json:"kind" yaml:"kind"`
	Metadata Metadata               `json:"metadata" yaml:"metadata"`
	Spec     map[string]interface{} `json:"spec" yaml:"spec"`
}

type Datasource struct {
	Kind     Kind           `json:"kind" yaml:"kind"`
	Metadata Metadata       `json:"metadata" yaml:"metadata"`
	Spec     DatasourceSpec `json:"spec" yaml:"spec"`
}

func (d *Datasource) GenerateID() string {
	return GenerateDatasourceID(d.Metadata.Name)
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
		return fmt.Errorf("invalid kind: '%s' for a Datasource type", tmp.Kind)
	}
	d.Kind = tmp.Kind
	d.Metadata = tmp.Metadata
	if specKind, ok := tmp.Spec["kind"]; !ok {
		return fmt.Errorf("attribute 'kind' not found in 'datasource.spec'")
	} else {
		rawSpec, err := staticMarshal(tmp.Spec)
		if err != nil {
			return err
		}
		var spec DatasourceSpec
		switch specKind {
		case string(datasource.PrometheusKind):
			spec = &datasource.Prometheus{}
		}
		if err := staticUnmarshal(rawSpec, spec); err != nil {
			return err
		}
		d.Spec = spec
	}
	return nil
}

func (d *Datasource) validate() error {
	if d.Kind != KindDatasource {
		return fmt.Errorf("invalid kind: '%s' for a Datasource type", d.Kind)
	}
	return nil
}
