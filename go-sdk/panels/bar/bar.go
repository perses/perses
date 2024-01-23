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

type Sort string

const (
	AscSort  Sort = "asc"
	DescSort Sort = "desc"
)

type Mode string

const (
	ValueMode      Mode = "value"
	PercentageMode Mode = "percentage"
)

type PluginSpec struct {
	Calculation commonSdk.Calculation `json:"calculation" yaml:"calculation"`
	Format      commonSdk.Format      `json:"format" yaml:"format"`
	Sort        Sort                  `json:"sort" yaml:"sort"`
	Mode        Mode                  `json:"mode" yaml:"mode"`
}

func NewPanelPlugin() *PanelPluginBuilder {
	return &PanelPluginBuilder{
		PluginSpec{
			Calculation: commonSdk.LastCalculation, // default in cue
			Format: commonSdk.Format{
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
		Kind: "BarChart",
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

func (b *PanelPluginBuilder) WithPercentFormat(unit commonSdk.TimeUnit) *PanelPluginBuilder {
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

func (b *PanelPluginBuilder) SortingBy(sort Sort) *PanelPluginBuilder {
	b.Sort = sort
	return b
}

func (b *PanelPluginBuilder) UsingMode(mode Mode) *PanelPluginBuilder {
	b.Mode = mode
	return b
}
