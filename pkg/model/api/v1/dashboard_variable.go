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
	"regexp"

	"gopkg.in/yaml.v2"
)

type VariableKind string

const (
	KindQueryVariable    VariableKind = "Query"
	KindConstantVariable VariableKind = "Constant"
)

var variableKindMap = map[VariableKind]bool{
	KindQueryVariable:    true,
	KindConstantVariable: true,
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
		return fmt.Errorf("kind cannot be empty")
	}
	if _, ok := variableKindMap[*k]; !ok {
		return fmt.Errorf("unknown variable.kind '%s' used", *k)
	}
	return nil
}

type VariableParameter interface {
}

type tmpQueryVariable struct {
	Expr   string `json:"expr" yaml:"expr"`
	Regexp string `json:"regexp" yaml:"regexp"`
}

type QueryVariableParameter struct {
	VariableParameter `json:"-" yaml:"-"`
	Expr              string `json:"expr" yaml:"expr"`
	// Regexp is the regexp used to filter the result returned by Expr once the query is performed.
	Regexp *regexp.Regexp `json:"regexp" yaml:"regexp"`
}

func (v *QueryVariableParameter) UnmarshalJSON(data []byte) error {
	var tmp tmpQueryVariable
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	if err := v.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (v *QueryVariableParameter) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp tmpQueryVariable
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if err := v.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (v *QueryVariableParameter) validate(tmp tmpQueryVariable) error {
	if len(tmp.Regexp) == 0 {
		return fmt.Errorf("regexp cannot be empty for a query variable")
	}
	if len(tmp.Expr) == 0 {
		return fmt.Errorf("expr cannot be empty for a query variable")
	}
	if re, err := regexp.Compile(tmp.Regexp); err != nil {
		return err
	} else {
		v.Regexp = re
	}
	v.Expr = tmp.Expr
	return nil
}

type ConstantVariableParameter struct {
	VariableParameter `json:"-" yaml:"-"`
	Values            []string `json:"values" yaml:"values"`
}

func (v *ConstantVariableParameter) UnmarshalJSON(data []byte) error {
	var tmp ConstantVariableParameter
	type plain ConstantVariableParameter
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *ConstantVariableParameter) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp ConstantVariableParameter
	type plain ConstantVariableParameter
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *ConstantVariableParameter) validate() error {
	if len(v.Values) == 0 {
		return fmt.Errorf("values cannot be empty for a constant variable")
	}
	return nil
}

type tmpDashboardVariable struct {
	Kind VariableKind `json:"kind" yaml:"kind"`
	// Selected is the variable selected by default if it exists
	Selected  string          `json:"selected,omitempty" yaml:"selected,omitempty"`
	Parameter json.RawMessage `json:"parameter" yaml:"parameter"`
}

type DashboardVariable struct {
	Kind VariableKind `json:"kind" yaml:"kind"`
	// Selected is the variable selected by default if it exists
	Selected  string            `json:"selected,omitempty" yaml:"selected,omitempty"`
	Parameter VariableParameter `json:"parameter" yaml:"parameter"`
}

func (d *DashboardVariable) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(panel interface{}) error {
		return json.Unmarshal(data, panel)
	}
	return d.unmarshal(jsonUnmarshalFunc, json.Unmarshal)
}

func (d *DashboardVariable) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return d.unmarshal(unmarshal, yaml.Unmarshal)
}

func (d *DashboardVariable) unmarshal(unmarshal func(interface{}) error, staticUnmarshal func([]byte, interface{}) error) error {
	var tmpVariable tmpDashboardVariable
	if err := unmarshal(&tmpVariable); err != nil {
		return err
	}
	d.Kind = tmpVariable.Kind
	d.Selected = tmpVariable.Selected
	if len(tmpVariable.Kind) == 0 {
		return fmt.Errorf("variable.kind cannot be empty")
	}

	switch tmpVariable.Kind {
	case KindQueryVariable:
		parameter := &QueryVariableParameter{}
		if err := staticUnmarshal(tmpVariable.Parameter, parameter); err != nil {
			return err
		}
		d.Parameter = parameter
	case KindConstantVariable:
		parameter := &ConstantVariableParameter{}
		if err := staticUnmarshal(tmpVariable.Parameter, parameter); err != nil {
			return err
		}
		d.Parameter = parameter
	default:
		return fmt.Errorf("variable kind not supported: '%s'", tmpVariable.Kind)
	}
	return nil
}
