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

package bar

import (
	"fmt"

	"github.com/perses/perses/go-sdk"
	commonSdk "github.com/perses/perses/go-sdk/common"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
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

func NewPanel(name string) *PanelBuilder {
	return &PanelBuilder{
		PanelBuilder: sdk.PanelBuilder{
			Panel: v1.Panel{
				Kind: "Panel",
				Spec: v1.PanelSpec{
					Display: v1.PanelDisplay{
						Name: name,
					},
					Plugin: common.Plugin{
						Kind: "BarChart",
						Spec: PluginSpec{
							Calculation: commonSdk.LastCalculation, // default in cue
							Format: commonSdk.Format{
								Unit: commonSdk.DecimalUnit,
							},
						},
					},
				},
			},
		},
	}
}

func NewPanelBuilder(panel v1.Panel) *PanelBuilder {
	return &PanelBuilder{PanelBuilder: sdk.PanelBuilder{Panel: panel}}
}

type PanelBuilder struct {
	sdk.PanelBuilder
}

func (b *PanelBuilder) WithCalculation(calculation commonSdk.Calculation) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set calculation %q", calculation))
		return b
	}
	pluginSpec.Calculation = calculation
	return b
}

func (b *PanelBuilder) WithTimeFormat(unit commonSdk.TimeUnit) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set time format with %q unit", unit))
		return b
	}
	pluginSpec.Format.Unit = string(unit)
	return b
}

func (b *PanelBuilder) WithPercentFormat(unit commonSdk.TimeUnit) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set percent format with %q unit", unit))
		return b
	}
	pluginSpec.Format.Unit = string(unit)
	return b
}

func (b *PanelBuilder) WithDecimalFormat() *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set decimal format with %q unit", commonSdk.DecimalUnit))
		return b
	}
	pluginSpec.Format.Unit = commonSdk.DecimalUnit
	return b
}

func (b *PanelBuilder) WithBytesFormat() *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set bytes format with %q unit", commonSdk.BytesUnit))
		return b
	}
	pluginSpec.Format.Unit = commonSdk.BytesUnit
	return b
}

func (b *PanelBuilder) WithThroughputFormat(unit commonSdk.ThroughputUnit) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set throughput format with %q unit", unit))
		return b
	}
	pluginSpec.Format.Unit = string(unit)
	return b
}

func (b *PanelBuilder) WithDecimalPlace(decimal int) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set decimal place at %d", decimal))
		return b
	}
	pluginSpec.Format.DecimalPlaces = &decimal
	return b
}

func (b *PanelBuilder) WithShortValues(enabled bool) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set short values"))
		return b
	}
	pluginSpec.Format.ShortValues = &enabled
	return b
}

func (b *PanelBuilder) SortingBy(sort Sort) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set sort %q", sort))
		return b
	}
	pluginSpec.Sort = sort
	return b
}

func (b *PanelBuilder) UsingMode(mode Mode) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set mode %q", mode))
		return b
	}
	pluginSpec.Mode = mode
	return b
}
