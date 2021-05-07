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

// QueryVariableLabelNames is representing the parameter to be used when filling the variable by using the HTTP endpoint
// `GET /api/v1/labels`
// More information here: https://prometheus.io/docs/prometheus/latest/querying/api/#getting-label-names
type QueryVariableLabelNames struct {
	// Matchers is the repeated series selector argument that selects the series from which to read the label names
	Matchers []string `json:"matchers,omitempty" yaml:"matchers,omitempty"`
}

// QueryVariableLabelValues is representing the parameter to be used when filling the variable by using the HTTP endpoint
// `GET /api/v1/label/<label_name>/values`
// More information here: https://prometheus.io/docs/prometheus/latest/querying/api/#querying-label-values
type QueryVariableLabelValues struct {
	LabelName string `json:"label_name" yaml:"label_name"`
	// Matchers is the repeated series selector argument that selects the series from which to read the label values
	Matchers []string `json:"matchers,omitempty" yaml:"matchers,omitempty"`
}

func (v *QueryVariableLabelValues) UnmarshalJSON(data []byte) error {
	var tmp QueryVariableLabelValues
	type plain QueryVariableLabelValues
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *QueryVariableLabelValues) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp QueryVariableLabelValues
	type plain QueryVariableLabelValues
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *QueryVariableLabelValues) validate() error {
	if len(v.LabelName) == 0 {
		return fmt.Errorf("'label_name' cannot be empty when using 'label_values' query parameter")
	}
	return nil
}

type tmpQueryVariable struct {
	Expr            string                    `json:"expr,omitempty" yaml:"expr,omitempty"`
	LabelNames      *QueryVariableLabelNames  `json:"label_names,omitempty" yaml:"label_names,omitempty"`
	LabelValues     *QueryVariableLabelValues `json:"label_values,omitempty" yaml:"label_values,omitempty"`
	CapturingRegexp string                    `json:"capturing_regexp" yaml:"capturing_regexp"`
}

type QueryVariableParameter struct {
	VariableParameter `json:"-" yaml:"-"`
	// Expr is the PromQL expression to be used when variable should be filled by using the HTTP endpoint
	// `GET /api/v1/query_range`
	// More information available here: https://prometheus.io/docs/prometheus/latest/querying/api/#range-queries
	Expr        string                    `json:"expr,omitempty" yaml:"expr,omitempty"`
	LabelNames  *QueryVariableLabelNames  `json:"label_names,omitempty" yaml:"label_names,omitempty"`
	LabelValues *QueryVariableLabelValues `json:"label_values,omitempty" yaml:"label_values,omitempty"`
	// CapturingRegexp is the regexp used to filter the result returned by Expr or by Lab once the query is performed.
	CapturingRegexp *regexp.Regexp `json:"capturing_regexp" yaml:"capturing_regexp"`
}

func (v *QueryVariableParameter) MarshalJSON() ([]byte, error) {
	tmp := &tmpQueryVariable{
		CapturingRegexp: v.CapturingRegexp.String(),
	}
	return json.Marshal(tmp)
}

func (v *QueryVariableParameter) MarshalYAML() (interface{}, error) {
	tmp := &tmpQueryVariable{
		CapturingRegexp: v.CapturingRegexp.String(),
	}
	return tmp, nil
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
	if len(tmp.CapturingRegexp) == 0 {
		return fmt.Errorf("'capturing_regexp' cannot be empty for a query variable")
	}
	if len(tmp.Expr) == 0 && tmp.LabelValues == nil && tmp.LabelNames == nil {
		return fmt.Errorf("'expr' or 'label_values' or 'label_names' should be used for a query variable")
	}
	if len(tmp.Expr) > 0 && (tmp.LabelValues != nil || tmp.LabelNames != nil) {
		return fmt.Errorf("when expr is used, you should not use 'label_values' or 'label_names'")
	}
	if tmp.LabelValues != nil && (len(tmp.Expr) > 0 || tmp.LabelNames != nil) {
		return fmt.Errorf("when label_values is used, you should not use 'expr' or 'label_names'")
	}
	if tmp.LabelNames != nil && (len(tmp.Expr) > 0 || tmp.LabelValues != nil) {
		return fmt.Errorf("when label_names is used, you should not use 'expr' or 'label_values'")
	}
	if re, err := regexp.Compile(tmp.CapturingRegexp); err != nil {
		return err
	} else {
		v.CapturingRegexp = re
	}
	v.Expr = tmp.Expr
	v.LabelValues = tmp.LabelValues
	v.LabelNames = tmp.LabelNames
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
	Selected  string                 `json:"selected,omitempty" yaml:"selected,omitempty"`
	Parameter map[string]interface{} `json:"parameter" yaml:"parameter"`
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
	switch tmpVariable.Kind {
	case KindQueryVariable:
		parameter := &QueryVariableParameter{}
		if err := staticUnmarshal(rawParameter, parameter); err != nil {
			return err
		}
		d.Parameter = parameter
	case KindConstantVariable:
		parameter := &ConstantVariableParameter{}
		if err := staticUnmarshal(rawParameter, parameter); err != nil {
			return err
		}
		d.Parameter = parameter
	default:
		return fmt.Errorf("variable kind not supported: '%s'", tmpVariable.Kind)
	}
	return nil
}
