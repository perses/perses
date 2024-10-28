// Copyright 2024 The Perses Authors
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

package table

import (
	"encoding/json"
	"fmt"

	"github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/panel"
	"gopkg.in/yaml.v3"
)

const PluginKind = "Table"

type Density string

const (
	CompactDensity  Density = "auto"
	StandardDensity Density = "always"
)

type Align string

const (
	LeftAlign   Align = "left"
	CenterAlign Align = "center"
	RightAlign  Align = "right"
)

type ColumnSettings struct {
	Name              string  `json:"name" yaml:"name"`
	Header            string  `json:"header,omitempty" yaml:"header,omitempty"`
	HeaderDescription string  `json:"headerDescription,omitempty" yaml:"headerDescription,omitempty"`
	CellDescription   string  `json:"cellDescription,omitempty" yaml:"cellDescription,omitempty"`
	Align             Align   `json:"align,omitempty" yaml:"align,omitempty"`
	EnableSorting     bool    `json:"enableSorting,omitempty" yaml:"enableSorting,omitempty"`
	Width             float64 `json:"width,omitempty" yaml:"width,omitempty"`
	Hide              bool    `json:"hide,omitempty" yaml:"hide,omitempty"`
}

type ValueConditionSpec struct {
	Value string `json:"value" yaml:"value"`
}

type RangeConditionSpec struct {
	Min float64 `json:"min,omitempty" yaml:"min,omitempty"`
	Max float64 `json:"max,omitempty" yaml:"max,omitempty"`
}

type RegexConditionSpec struct {
	Expr string `json:"expr" yaml:"expr"`
}

type MiscValue string

var (
	EmptyValue MiscValue = "empty"
	NullValue  MiscValue = "null"
	NaNValue   MiscValue = "NaN"
	TrueValue  MiscValue = "true"
	FalseValue MiscValue = "false"
)

type MiscConditionSpec struct {
	Value MiscValue `json:"value" yaml:"value"`
}

type ConditionKind string

const (
	ValueConditionKind ConditionKind = "Value"
	RangeConditionKind ConditionKind = "Range"
	RegexConditionKind ConditionKind = "Regex"
	MiscConditionKind  ConditionKind = "Misc"
)

type Condition struct {
	Kind ConditionKind `json:"kind" yaml:"kind"`
	Spec interface{}   `json:"spec" yaml:"spec"`
}

func (c *Condition) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(variable interface{}) error {
		return json.Unmarshal(data, variable)
	}
	return c.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (c *Condition) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return c.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (c *Condition) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmp Condition
	type plain Condition
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	rawSpec, err := staticMarshal(tmp.Spec)
	if err != nil {
		return err
	}
	var spec interface{}
	switch tmp.Kind {
	case ValueConditionKind:
		spec = &ValueConditionSpec{}
	case RangeConditionKind:
		spec = &RangeConditionSpec{}
	case RegexConditionKind:
		spec = &RegexConditionSpec{}
	case MiscConditionKind:
		spec = &MiscConditionSpec{}
	default:
		return fmt.Errorf("unknown transform.kind %q used", tmp.Kind)
	}
	if unMarshalErr := staticUnmarshal(rawSpec, spec); unMarshalErr != nil {
		return unMarshalErr
	}
	c.Kind = tmp.Kind
	c.Spec = spec
	return nil
}

type CellSettings struct {
	Condition       Condition `json:"condition" yaml:"condition"`
	Text            string    `json:"text,omitempty" yaml:"text,omitempty"`
	TextColor       string    `json:"textColor,omitempty" yaml:"textColor,omitempty"`
	BackgroundColor string    `json:"backgroundColor,omitempty" yaml:"backgroundColor,omitempty"`
}

type PluginSpec struct {
	Density        Density            `json:"density,omitempty" yaml:"density,omitempty"`
	ColumnSettings []ColumnSettings   `json:"columnSettings,omitempty" yaml:"columnSettings,omitempty"`
	CellSettings   []CellSettings     `json:"cellSettings,omitempty" yaml:"cellSettings,omitempty"`
	Transforms     []common.Transform `json:"transforms,omitempty" yaml:"transforms,omitempty"`
}

type Option func(plugin *Builder) error

func create(options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	for _, opt := range options {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
}

func Table(options ...Option) panel.Option {
	return func(builder *panel.Builder) error {
		plugin, err := create(options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = PluginKind
		builder.Spec.Plugin.Spec = plugin.PluginSpec
		return nil
	}
}
