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

package datasource

import (
	"encoding/json"
	"fmt"
)

type Kind string

const PrometheusKind Kind = "Prometheus"

var kindMap = map[Kind]bool{
	PrometheusKind: true,
}

func (k *Kind) UnmarshalJSON(data []byte) error {
	var tmp Kind
	type plain Kind
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Kind) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Kind
	type plain Kind
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Kind) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("spec.kind cannot be empty")
	}
	if _, ok := kindMap[*k]; !ok {
		return fmt.Errorf("unknown spec.kind '%s' used", *k)
	}
	return nil
}

type BasicDatasource struct {
	Kind    Kind `json:"kind" yaml:"kind"`
	Default bool `json:"default" yaml:"default"`
}
