// Copyright The Perses Authors
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

// Package panels provides reusable panel builders for the dac-playground-go.
// Each function returns a panelgroup.Option so it can be passed directly to
// dashboard.AddPanelGroup alongside layout options such as PanelsPerLine.
package panels

import (
	"github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/panel"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	promQuery "github.com/perses/plugins/prometheus/sdk/go/query"
	timeseries "github.com/perses/plugins/timeserieschart/sdk/go"
)

func decimalFomrat() *common.Format {
	unit := common.DecimalUnit
	return &common.Format{Unit: &unit}
}

// CPUUsage returns a timeseries panel showing the average CPU usage (%) across
// all cores, scoped to the $instance variable when present.
func CPUUsage() panelgroup.Option {
	return panelgroup.AddPanel("CPU Usage",
		timeseries.Chart(
			timeseries.WithYAxis(timeseries.YAxis{
				Format: decimalFomrat(),
			}),
		),
		panel.AddQuery(
			promQuery.PromQL(
				`sum by(instance) (rate(avalanche_counter_metric_mmmmm_0_0_total[5m]))`,
				promQuery.SeriesNameFormat("{{instance}}"),
			),
		),
	)
}

// MemoryUsage returns a timeseries panel showing the percentage of memory
// currently in use (total - free - buffers - cached).
func MemoryUsage() panelgroup.Option {
	return panelgroup.AddPanel("Memory Usage",
		timeseries.Chart(
			timeseries.WithYAxis(timeseries.YAxis{
				Format: decimalFomrat(),
			}),
		),
		panel.AddQuery(
			promQuery.PromQL(
				`sum by(instance) (rate(avalanche_counter_metric_mmmmm_0_1_total[5m]))`,
				promQuery.SeriesNameFormat("{{instance}}"),
			),
		),
	)
}

// MemoryUsage2 returns a timeseries panel showing the percentage of memory
// currently in use (total - free - buffers - cached).
func MemoryUsage2() panelgroup.Option {
	return panelgroup.AddPanel("Memory Usage 2",
		timeseries.Chart(
			timeseries.WithYAxis(timeseries.YAxis{
				Format: decimalFomrat(),
			}),
		),
		panel.AddQuery(
			promQuery.PromQL(
				`sum by(instance) (rate(avalanche_counter_metric_mmmmm_0_2_total[5m]))`,
				promQuery.SeriesNameFormat("{{instance}}"),
			),
		),
	)
}
