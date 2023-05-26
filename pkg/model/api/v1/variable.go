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

package v1

import (
	"encoding/json"
	"fmt"

	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"gopkg.in/yaml.v2"
)

type VariableSpec struct {
	// Kind is the type of the variable. Depending on the value of Kind, it will change the content of Spec.
	Kind variable.Kind `json:"kind" yaml:"kind"`
	Spec interface{}   `json:"spec" yaml:"spec"`
}

func (v *VariableSpec) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(variable interface{}) error {
		return json.Unmarshal(data, variable)
	}
	return v.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (v *VariableSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return v.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (v *VariableSpec) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmp VariableSpec
	type plain VariableSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	rawSpec, err := staticMarshal(tmp.Spec)
	if err != nil {
		return err
	}
	var spec interface{}
	switch tmp.Kind {
	case variable.KindList:
		spec = &variable.ListSpec{}
	case variable.KindText:
		spec = &variable.TextSpec{}
	default:
		return fmt.Errorf("unknown variable.kind %q used", tmp.Kind)
	}
	if unMarshalErr := staticUnmarshal(rawSpec, spec); unMarshalErr != nil {
		return unMarshalErr
	}
	v.Kind = tmp.Kind
	v.Spec = spec
	return nil
}

// GlobalVariable is a global variable that be used everywhere regardless the project.
type GlobalVariable struct {
	Kind     Kind         `json:"kind" yaml:"kind"`
	Metadata Metadata     `json:"metadata" yaml:"metadata"`
	Spec     VariableSpec `json:"spec" yaml:"spec"`
}

func (v *GlobalVariable) GetMetadata() modelAPI.Metadata {
	return &v.Metadata
}

func (v *GlobalVariable) GetKind() string {
	return string(v.Kind)
}

func (v *GlobalVariable) GetSpec() interface{} {
	return v.Spec
}

// Variable relates to variables defined at project level.
// If you are looking for variable defined at dashboard level, see dashboard.Variable
type Variable struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     VariableSpec    `json:"spec" yaml:"spec"`
}

func (v *Variable) GetMetadata() modelAPI.Metadata {
	return &v.Metadata
}

func (v *Variable) GetKind() string {
	return string(v.Kind)
}

func (v *Variable) GetSpec() interface{} {
	return v.Spec
}
