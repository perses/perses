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

type VariableDisplay struct {
	common.Display `json:",inline" yaml:",inline"`
	Hidden         bool `json:"hidden" yaml:"hidden"`
}

type CommonVariableSpec struct {
	Name    string           `json:"name" yaml:"name"`
	Display *VariableDisplay `json:"display,omitempty" yaml:"display,omitempty"`
}

type TextVariableSpec struct {
	VariableSpec       `json:"-" yaml:"-"`
	CommonVariableSpec `json:",inline" yaml:",inline"`
	Value              string `json:"value" yaml:"value"`
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
	if len(v.Value) == 0 {
		return fmt.Errorf("value for the variable %q cannot be empty", v.Name)
	}
	return nil
}

type DefaultVariableValue struct {
	SingleValue string
	SliceValues []string
}

func (v *DefaultVariableValue) UnmarshalJSON(data []byte) error {
	var s string
	var slice []string
	if unmarshalStringErr := json.Unmarshal(data, &s); unmarshalStringErr != nil {
		if unmarshalSliceErr := json.Unmarshal(data, &slice); unmarshalSliceErr != nil {
			return fmt.Errorf("unable to unmarshal default_value. Only string or array of string can be used")
		}
	}
	v.SingleValue = s
	v.SliceValues = slice
	return nil
}

func (v *DefaultVariableValue) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var s string
	var slice []string
	if unmarshalStringErr := unmarshal(&s); unmarshalStringErr != nil {
		if unmarshalSliceErr := unmarshal(&slice); unmarshalSliceErr != nil {
			return fmt.Errorf("unable to unmarshal default_value. Only string or array of string can be used")
		}
	}
	v.SingleValue = s
	v.SliceValues = slice
	return nil
}

func (v *DefaultVariableValue) MarshalJSON() ([]byte, error) {
	if len(v.SingleValue) > 0 {
		return json.Marshal(v.SingleValue)
	}
	return json.Marshal(v.SliceValues)
}

func (v *DefaultVariableValue) MarshalYAML() (interface{}, error) {
	if len(v.SingleValue) > 0 {
		return v.SingleValue, nil
	}
	return v.SliceValues, nil
}

type ListVariableSpec struct {
	VariableSpec       `json:"-" yaml:"-"`
	CommonVariableSpec `json:",inline" yaml:",inline"`
	DefaultValue       *DefaultVariableValue `json:"default_value,omitempty" yaml:"default_value,omitempty"`
	AllowAllValue      bool                  `json:"allow_all_value" yaml:"allow_all_value"`
	AllowMultiple      bool                  `json:"allow_multiple" yaml:"allow_multiple"`
	// CustomAllValue is a custom value that will be used if AllowAllValue is true and if then `all` is selected
	CustomAllValue string `json:"custom_all_value,omitempty" yaml:"custom_all_value,omitempty"`
	// CapturingRegexp is the regexp used to catch and filter the result of the query.
	// If empty, then nothing is filtered. That's the equivalent of setting CapturingRegexp with (.*)
	CapturingRegexp string        `json:"capturing_regexp,omitempty" yaml:"capturing_regexp,omitempty"`
	Plugin          common.Plugin `json:"plugin" yaml:"plugin"`
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
	if len(v.CustomAllValue) > 0 && !v.AllowAllValue {
		return fmt.Errorf("custom_all_value cannot be set if allow_all_value is not set to true")
	}
	if v.DefaultValue != nil && len(v.DefaultValue.SliceValues) > 0 && !v.AllowMultiple {
		return fmt.Errorf("you can not use a list of default values if allow_multiple is set to false")
	}

	return nil
}

type Variable struct {
	// Kind is the type of the variable. Depending on the value of Kind, it will change the content of Spec.
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
