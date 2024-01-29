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

package time_series

import (
	commonSdk "github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/panel"
)

type LegendPosition string

const (
	BottomPosition LegendPosition = "bottom"
	RightPosition  LegendPosition = "right"
)

type LegendMode string

const (
	ListMode  LegendMode = "list"
	TableMode LegendMode = "table"
)

type LegendSize string

const (
	SmallSize  LegendSize = "small"
	MediumSize LegendSize = "medium"
)

type Legend struct {
	Position LegendPosition          `json:"position" yaml:"position"`
	Mode     LegendMode              `json:"mode,omitempty" yaml:"mode,omitempty"`
	Size     LegendSize              `json:"size,omitempty" yaml:"size,omitempty"`
	Values   []commonSdk.Calculation `json:"values,omitempty" yaml:"values,omitempty"`
}

type Tooltip struct {
	EnablePinning bool `json:"enablePinning,omitempty" yaml:"enablePinning,omitempty"`
}

type PaletteMode string

const (
	AutoMode        PaletteMode = "auto"
	CategoricalMode PaletteMode = "categorical"
)

type Palette struct {
	Mode PaletteMode `json:"mode" yaml:"mode"`
}

type VisualDisplay string

const (
	LineDisplay VisualDisplay = "line"
	BarDisplay  VisualDisplay = "bar"
)

type VisualShowPoints string

const (
	AutoShowPoints   VisualShowPoints = "auto"
	AlwaysShowPoints VisualShowPoints = "always"
)

type VisualStack string

const (
	AllStack        VisualStack = "all"
	PercentageStack VisualStack = "percent"
)

type Visual struct {
	Display      VisualDisplay    `json:"display,omitempty" yaml:"display,omitempty"`
	LineWidth    int              `json:"lineWidth,omitempty" yaml:"lineWidth,omitempty"`
	AreaOpacity  int              `json:"areaOpacity,omitempty" yaml:"areaOpacity,omitempty"`
	ShowPoints   VisualShowPoints `json:"showPoints,omitempty" yaml:"showPoints,omitempty"`
	Palette      int              `json:"palette,omitempty" yaml:"palette,omitempty"`
	PointRadius  int              `json:"pointRadius,omitempty" yaml:"pointRadius,omitempty"`
	Stack        VisualStack      `json:"stack,omitempty" yaml:"stack,omitempty"`
	ConnectNulls bool             `json:"connectNulls,omitempty" yaml:"connectNulls,omitempty"`
}

type YAxis struct {
	Show   bool              `json:"show,omitempty" yaml:"show,omitempty"`
	Label  string            `json:"label,omitempty" yaml:"label,omitempty"`
	Format *commonSdk.Format `json:"format,omitempty" yaml:"format,omitempty"`
	Min    int               `json:"min,omitempty" yaml:"min,omitempty"`
	Max    int               `json:"max,omitempty" yaml:"max,omitempty"`
}

type PluginSpec struct {
	Legend     *Legend               `json:"legend,omitempty" yaml:"legend,omitempty"`
	Tooltip    *Tooltip              `json:"tooltip,omitempty" yaml:"tooltip,omitempty"`
	YAxis      *YAxis                `json:"yAxis,omitempty" yaml:"yAxis,omitempty"`
	Thresholds *commonSdk.Thresholds `json:"thresholds,omitempty" yaml:"thresholds,omitempty"`
	Visual     *Visual               `json:"visual,omitempty" yaml:"visual,omitempty"`
}

type Option func(plugin *Builder) error

func NewPlugin(options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	PluginSpec
}

func TimeSeries(options ...Option) panel.Option {
	return func(builder *panel.Builder) error {
		plugin, err := NewPlugin(options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = "TimeSeriesChart"
		builder.Spec.Plugin.Spec = plugin.PluginSpec
		return nil
	}
}
