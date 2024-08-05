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
	"github.com/perses/perses/go-sdk/panel"
)

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

type PluginSpec struct {
	Density        Density          `json:"density,omitempty" yaml:"density,omitempty"`
	ColumnSettings []ColumnSettings `json:"columnSettings,omitempty" yaml:"columnSettings,omitempty"`
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

		builder.Spec.Plugin.Kind = "Table"
		builder.Spec.Plugin.Spec = plugin.PluginSpec
		return nil
	}
}
