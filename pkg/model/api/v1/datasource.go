// Copyright 2021 Amadeus s.a.s
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
	"net/url"
)

func GenerateDatasourceID(name string) string {
	return fmt.Sprintf("/datasources/%s", name)
}

type DatasourceSpec struct {
	URL *url.URL `json:"url" yaml:"url"`
}

type tmpDatasourceSpec struct {
	URL string `json:"url" yaml:"url"`
}

func (d *DatasourceSpec) MarshalJSON() ([]byte, error) {
	tmp := &tmpDatasourceSpec{
		URL: d.URL.String(),
	}
	return json.Marshal(tmp)
}

func (d *DatasourceSpec) MarshalYAML() (interface{}, error) {
	tmp := &tmpDatasourceSpec{
		URL: d.URL.String(),
	}
	return tmp, nil
}

func (d *DatasourceSpec) UnmarshalJSON(data []byte) error {
	var tmp tmpDatasourceSpec
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	if err := d.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (d *DatasourceSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp tmpDatasourceSpec
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if err := d.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (d *DatasourceSpec) validate(spec tmpDatasourceSpec) error {
	if u, err := url.Parse(spec.URL); err != nil {
		return err
	} else {
		d.URL = u
	}
	return nil
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
	var tmp Datasource
	type plain Datasource
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *Datasource) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Datasource
	type plain Datasource
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *Datasource) validate() error {
	if d.Kind != KindDatasource {
		return fmt.Errorf("invalid kind: '%s' for a Datasource type", d.Kind)
	}
	return nil
}
