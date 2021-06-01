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

// CapturingRegexp is just an alias to regexp.Regexp.
// It used mainly to be able to override the way to unmarshall and marshall a regexp
type CapturingRegexp regexp.Regexp

func (c *CapturingRegexp) GetRegexp() *regexp.Regexp {
	return (*regexp.Regexp)(c)
}

// MarshalText is used during the marshal of a json. It will be considered as a text and not as a json struct.
func (c *CapturingRegexp) MarshalText() ([]byte, error) {
	return []byte(c.GetRegexp().String()), nil
}

func (c *CapturingRegexp) MarshalYAML() (interface{}, error) {
	return c.GetRegexp().String(), nil
}

func (c *CapturingRegexp) UnmarshalJSON(data []byte) error {
	var tmp string
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	if err := c.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (c *CapturingRegexp) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp string
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if err := c.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (c *CapturingRegexp) validate(reg string) error {
	if len(reg) == 0 {
		return fmt.Errorf("regexp cannot be empty")
	}
	if re, err := regexp.Compile(reg); err != nil {
		return err
	} else {
		*c = CapturingRegexp(*re)
	}
	return nil
}

type VariableKind string

const (
	KindPromQLQueryVariable      VariableKind = "PromQLQuery"
	KindLabelNamesQueryVariable  VariableKind = "LabelNamesQuery"
	KindLabelValuesQueryVariable VariableKind = "LabelValuesQuery"
	KindConstantVariable         VariableKind = "Constant"
)

var variableKindMap = map[VariableKind]bool{
	KindPromQLQueryVariable:      true,
	KindLabelNamesQueryVariable:  true,
	KindLabelValuesQueryVariable: true,
	KindConstantVariable:         true,
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
	if _, ok := variableKindMap[*k]; !ok {
		return fmt.Errorf("unknown variable.kind '%s' used", *k)
	}
	return nil
}

type VariableParameter interface {
}

// LabelNamesQueryVariableParameter is representing the parameter to be used when filling the variable by using the HTTP endpoint
// `GET /api/v1/labels`
// More information here: https://prometheus.io/docs/prometheus/latest/querying/api/#getting-label-names
type LabelNamesQueryVariableParameter struct {
	VariableParameter `json:"-" yaml:"-"`
	// Matchers is the repeated series selector argument that selects the series from which to read the label names
	Matchers []string `json:"matchers,omitempty" yaml:"matchers,omitempty"`
	// CapturingRegexp is the regexp used to catch and filter the result of the query.
	CapturingRegexp *CapturingRegexp `json:"capturing_regexp" yaml:"capturing_regexp"`
}

func (v *LabelNamesQueryVariableParameter) UnmarshalJSON(data []byte) error {
	var tmp LabelNamesQueryVariableParameter
	type plain LabelNamesQueryVariableParameter
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *LabelNamesQueryVariableParameter) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp LabelNamesQueryVariableParameter
	type plain LabelNamesQueryVariableParameter
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *LabelNamesQueryVariableParameter) validate() error {
	if v.CapturingRegexp == nil {
		return fmt.Errorf("'parameter.capturing_regexp' cannot be empty for a LabelNamesQuery")
	}
	return nil
}

// LabelValuesQueryVariableParameter is representing the parameter to be used when filling the variable by using the HTTP endpoint
// `GET /api/v1/label/<label_name>/values`
// More information here: https://prometheus.io/docs/prometheus/latest/querying/api/#querying-label-values
type LabelValuesQueryVariableParameter struct {
	VariableParameter `json:"-" yaml:"-"`
	LabelName         string `json:"label_name" yaml:"label_name"`
	// Matchers is the repeated series selector argument that selects the series from which to read the label values
	Matchers []string `json:"matchers,omitempty" yaml:"matchers,omitempty"`
	// CapturingRegexp is the regexp used to catch and filter the result of the query.
	CapturingRegexp *CapturingRegexp `json:"capturing_regexp" yaml:"capturing_regexp"`
}

func (v *LabelValuesQueryVariableParameter) UnmarshalJSON(data []byte) error {
	var tmp LabelValuesQueryVariableParameter
	type plain LabelValuesQueryVariableParameter
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *LabelValuesQueryVariableParameter) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp LabelValuesQueryVariableParameter
	type plain LabelValuesQueryVariableParameter
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *LabelValuesQueryVariableParameter) validate() error {
	if len(v.LabelName) == 0 {
		return fmt.Errorf("'parameter.label_name' cannot be empty for a LabelValuesQuery")
	}
	if v.CapturingRegexp == nil {
		return fmt.Errorf("'parameter.capturing_regexp' cannot be empty for a LabelValuesQuery")
	}
	return nil
}

type PromQLQueryVariableParameter struct {
	VariableParameter `json:"-" yaml:"-"`
	// Expr is the PromQL expression to be used when variable should be filled by using the HTTP endpoint
	// `GET /api/v1/query_range`
	// More information available here: https://prometheus.io/docs/prometheus/latest/querying/api/#range-queries
	Expr string `json:"expr,omitempty" yaml:"expr,omitempty"`
	// LabelName is the name of the label which is used once the PromQL query is performed to select the labelValue in the metric
	LabelName       string           `json:"label_name" yaml:"label_name"`
	CapturingRegexp *CapturingRegexp `json:"capturing_regexp" yaml:"capturing_regexp"`
}

func (v *PromQLQueryVariableParameter) UnmarshalJSON(data []byte) error {
	var tmp PromQLQueryVariableParameter
	type plain PromQLQueryVariableParameter
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *PromQLQueryVariableParameter) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PromQLQueryVariableParameter
	type plain PromQLQueryVariableParameter
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *PromQLQueryVariableParameter) validate() error {
	if len(v.Expr) == 0 {
		return fmt.Errorf("parameter.expr cannot be empty for a PromQLQuery")
	}
	if len(v.LabelName) == 0 {
		return fmt.Errorf("parameter.label_name cannot be empty for a PromQLQuery")
	}
	if v.CapturingRegexp == nil {
		return fmt.Errorf("parameter.capturing_regexp cannot be empty for a PromQLQuery")
	}
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
		return fmt.Errorf("parameter.values cannot be empty for a constant variable")
	}
	return nil
}

type tmpDashboardVariable struct {
	Kind      VariableKind           `json:"kind" yaml:"kind"`
	Hide      bool                   `json:"hide" yaml:"hide"`
	Selected  string                 `json:"selected,omitempty" yaml:"selected,omitempty"`
	Parameter map[string]interface{} `json:"parameter" yaml:"parameter"`
}

type DashboardVariable struct {
	Kind VariableKind `json:"kind" yaml:"kind"`
	// Hide will be used by the UI to decide if the variable has to be displayed
	Hide bool `json:"hide" yaml:"hide"`
	// Selected is the variable selected by default if it exists
	Selected  string            `json:"selected,omitempty" yaml:"selected,omitempty"`
	Parameter VariableParameter `json:"parameter" yaml:"parameter"`
}

func (d *DashboardVariable) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(panel interface{}) error {
		return json.Unmarshal(data, panel)
	}
	return d.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (d *DashboardVariable) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return d.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (d *DashboardVariable) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmpVariable tmpDashboardVariable
	if err := unmarshal(&tmpVariable); err != nil {
		return err
	}
	d.Kind = tmpVariable.Kind
	d.Selected = tmpVariable.Selected

	if len(tmpVariable.Kind) == 0 {
		return fmt.Errorf("variable.kind cannot be empty")
	}

	rawParameter, err := staticMarshal(tmpVariable.Parameter)
	if err != nil {
		return err
	}
	var parameter interface{}
	switch tmpVariable.Kind {
	case KindPromQLQueryVariable:
		parameter = &PromQLQueryVariableParameter{}
	case KindLabelNamesQueryVariable:
		parameter = &LabelNamesQueryVariableParameter{}
	case KindLabelValuesQueryVariable:
		parameter = &LabelValuesQueryVariableParameter{}
	case KindConstantVariable:
		parameter = &ConstantVariableParameter{}
	}
	if err := staticUnmarshal(rawParameter, parameter); err != nil {
		return err
	}
	d.Parameter = parameter
	return nil
}
