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

package dashboard

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"gopkg.in/yaml.v2"
)

type variableSpec interface {
	// GetName returns the name of the variable. It will be used to reference the variable in others
	GetName() string
}

type TextVariableSpec struct {
	variableSpec      `json:"-" yaml:"-"`
	variable.TextSpec `json:",inline" yaml:",inline"`
	Name              string `json:"name" yaml:"name"`
}

func (v *TextVariableSpec) GetName() string {
	return v.Name
}

func (v *TextVariableSpec) UnmarshalJSON(data []byte) error {
	var tmp TextVariableSpec
	type plain TextVariableSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *TextVariableSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp TextVariableSpec
	type plain TextVariableSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *TextVariableSpec) validate() error {
	if err := common.ValidateID(v.Name); err != nil {
		return err
	}
	if _, err := strconv.Atoi(v.Name); err == nil {
		return fmt.Errorf("variable name cannot contain only digits. That's not a meaningful name for a variable")
	}
	return v.TextSpec.Validate()
}

type ListVariableSpec struct {
	variableSpec      `json:"-" yaml:"-"`
	variable.ListSpec `json:",inline" yaml:",inline"`
	Name              string `json:"name" yaml:"name"`
}

func (v *ListVariableSpec) GetName() string {
	return v.Name
}

func (v *ListVariableSpec) UnmarshalJSON(data []byte) error {
	var tmp ListVariableSpec
	type plain ListVariableSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *ListVariableSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp ListVariableSpec
	type plain ListVariableSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *ListVariableSpec) validate() error {
	if err := common.ValidateID(v.Name); err != nil {
		return err
	}
	return v.ListSpec.Validate()
}

type Variable struct {
	// Kind is the type of the variable. Depending on the value of Kind, it will change the content of Spec.
	Kind variable.Kind `json:"kind" yaml:"kind"`
	Spec variableSpec  `json:"spec" yaml:"spec"`
}

type tmpVariable struct {
	Kind variable.Kind `json:"kind" yaml:"kind"`
	Spec interface{}   `json:"spec" yaml:"spec"`
}

func (v *Variable) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(variable interface{}) error {
		return json.Unmarshal(data, variable)
	}
	return v.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (v *Variable) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return v.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (v *Variable) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmp tmpVariable
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	rawSpec, err := staticMarshal(tmp.Spec)
	if err != nil {
		return err
	}
	var spec variableSpec
	switch tmp.Kind {
	case variable.KindList:
		spec = &ListVariableSpec{}
	case variable.KindText:
		spec = &TextVariableSpec{}
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
