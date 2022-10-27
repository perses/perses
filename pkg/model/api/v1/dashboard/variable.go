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

	"github.com/perses/perses/pkg/model/api/v1/common"
	"gopkg.in/yaml.v2"
)

type VariableKind string

const (
	TextVariable VariableKind = "TextVariable"
	ListVariable VariableKind = "ListVariable"
)

var KindMap = map[VariableKind]bool{
	TextVariable: true,
	ListVariable: true,
}

func (k *VariableKind) UnmarshalJSON(data []byte) error {
	var tmp VariableKind
	type plain VariableKind
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *VariableKind) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp VariableKind
	type plain VariableKind
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *VariableKind) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("variable.kind cannot be empty")
	}
	if _, ok := KindMap[*k]; !ok {
		return fmt.Errorf("unknown variable.kind %q used", *k)
	}
	return nil
}

type VariableSpec interface {
	// GetName returns the name of the variable. It will be used to reference the variable in others
	GetName() string
}

type TextVariableSpec struct {
	VariableSpec `json:"-" yaml:"-"`
	Name         string          `json:"name" yaml:"name"`
	Value        string          `json:"value" yaml:"value"`
	Display      *common.Display `json:"display,omitempty" yaml:"display,omitempty"`
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
	if len(v.Value) == 0 {
		return fmt.Errorf("value for the variable %q cannot be empty", v.Name)
	}
	return nil
}

type ListVariableSpec struct {
	VariableSpec  `json:"-" yaml:"-"`
	Name          string          `json:"name" yaml:"name"`
	AllowAllValue bool            `json:"allow_all_value,omitempty" yaml:"allow_all_value,omitempty"`
	AllowMultiple bool            `json:"allow_multiple,omitempty" yaml:"allow_multiple,omitempty"`
	Display       *common.Display `json:"display,omitempty" yaml:"display,omitempty"`
	Plugin        common.Plugin   `json:"plugin" yaml:"plugin"`
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
	return nil
}

type Variable struct {
	// Kind is the type of the variable. Depending of the value of Kind, it will change the content of Spec.
	Kind VariableKind `json:"kind" yaml:"kind"`
	Spec VariableSpec `json:"spec" yaml:"spec"`
}

type tmpVariable struct {
	Kind VariableKind `json:"kind" yaml:"kind"`
	Spec interface{}  `json:"spec" yaml:"spec"`
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
	var spec VariableSpec
	switch tmp.Kind {
	case ListVariable:
		spec = &ListVariableSpec{}
	case TextVariable:
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
