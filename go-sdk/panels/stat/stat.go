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

package bar

import (
	commonSdk "github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

type Sparkline struct {
	Color string `json:"color,omitempty" yaml:"color,omitempty"`
	Width int    `json:"width,omitempty" yaml:"width,omitempty"`
}

type PluginSpec struct {
	Calculation   commonSdk.Calculation `json:"calculation" yaml:"calculation"`
	Format        *commonSdk.Format     `json:"format,omitempty" yaml:"format,omitempty"`
	Thresholds    *commonSdk.Thresholds `json:"thresholds,omitempty" yaml:"thresholds,omitempty"`
	Sparkline     *Sparkline            `json:"sparkline,omitempty" yaml:"sparkline,omitempty"`
	ValueFontSize int                   `json:"valueFontSize,omitempty" yaml:"valueFontSize,omitempty"`
}

func NewPanelPlugin() *PanelPluginBuilder {
	return &PanelPluginBuilder{
		PluginSpec{
			Calculation: commonSdk.LastCalculation, // default in cue
			Format: &commonSdk.Format{
				Unit: commonSdk.DecimalUnit,
			},
		},
	}
}

type PanelPluginBuilder struct {
	PluginSpec
}

func (b *PanelPluginBuilder) Build() common.Plugin {
	return common.Plugin{
		Kind: "StatChart",
		Spec: b.PluginSpec,
	}
}

func (b *PanelPluginBuilder) WithCalculation(calculation commonSdk.Calculation) *PanelPluginBuilder {
	b.Calculation = calculation
	return b
}

func (b *PanelPluginBuilder) WithTimeFormat(unit commonSdk.TimeUnit) *PanelPluginBuilder {
	b.Format.Unit = string(unit)
	return b
}

func (b *PanelPluginBuilder) WithPercentFormat(unit commonSdk.PercentageUnit) *PanelPluginBuilder {
	b.Format.Unit = string(unit)
	return b
}

func (b *PanelPluginBuilder) WithDecimalFormat() *PanelPluginBuilder {
	b.Format.Unit = commonSdk.DecimalUnit
	return b
}

func (b *PanelPluginBuilder) WithBytesFormat() *PanelPluginBuilder {
	b.Format.Unit = commonSdk.BytesUnit
	return b
}

func (b *PanelPluginBuilder) WithThroughputFormat(unit commonSdk.ThroughputUnit) *PanelPluginBuilder {
	b.Format.Unit = string(unit)
	return b
}

func (b *PanelPluginBuilder) WithDecimalPlace(decimal int) *PanelPluginBuilder {
	b.Format.DecimalPlaces = &decimal
	return b
}

func (b *PanelPluginBuilder) WithShortValues(enabled bool) *PanelPluginBuilder {
	b.Format.ShortValues = &enabled
	return b
}

func (b *PanelPluginBuilder) WithThresholds(thresholds commonSdk.Thresholds) *PanelPluginBuilder {
	b.Thresholds = &thresholds
	return b
}

func (b *PanelPluginBuilder) WithSparkline(sparkline Sparkline) *PanelPluginBuilder {
	b.Sparkline = &sparkline
	return b
}

func (b *PanelPluginBuilder) WithValueFontSize(size int) *PanelPluginBuilder {
	b.ValueFontSize = size
	return b
}
