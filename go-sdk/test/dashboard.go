// Copyright 2025 The Perses Authors
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

package dac

import (
	"fmt"

	"github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/panel"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/plugins/prometheus/sdk/go/query"
	table "github.com/perses/plugins/table/sdk/go"
	timeseries "github.com/perses/plugins/timeserieschart/sdk/go"
)

const (
	filter    = "stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\",pod=~\"$pod\",container=~\"$container\""
	memMetric = "container_memory_rss"
	cpuMetric = "container_cpu_usage_seconds"
	grouping  = "by (container)"
)

func buildMemoryPanel(grouping string) panelgroup.Option {
	return panelgroup.AddPanel("Container memory",
		timeseries.Chart(),
		panel.AddQuery(
			query.PromQL(fmt.Sprintf("max %s (%s{%s})", grouping, memMetric, filter)),
		),
	)
}

func buildCPUPanel(grouping string) panelgroup.Option {
	return panelgroup.AddPanel("Container CPU",
		timeseries.Chart(
			timeseries.WithQuerySettings(
				[]timeseries.QuerySettingsItem{
					{
						QueryIndex: 0,
						ColorMode:  "fixed-single",
						ColorValue: "#0be300",
					},
				},
			),
		),
		panel.AddQuery(
			query.PromQL(fmt.Sprintf("sum %s (%s{%s})", grouping, cpuMetric, filter)),
		),
		panel.AddLink("http://localhost:3000/projects/perses/dashboards/hello?var-stack=$stack&var-prometheus=$prometheus&var-prometheus_namespace=$prometheus_namespace&var-namespace=$namespace&var-namespaceLabels=$namespaceLabels&var-pod=$pod&var-container=$container&var-containerLabels=$containerLabels"),
	)
}

func buildTargetStatusPanel() panelgroup.Option {
	return panelgroup.AddPanel("Target status",
		table.Table(
			table.WithCellSettings([]table.CellSettings{
				{
					Condition: table.Condition{
						Kind: table.ValueConditionKind,
						Spec: table.ValueConditionSpec{
							Value: "1",
						},
					},
					Text:            "UP",
					BackgroundColor: "#00FF00",
				},
				{
					Condition: table.Condition{
						Kind: table.ValueConditionKind,
						Spec: table.ValueConditionSpec{
							Value: "0",
						},
					},
					Text:            "DOWN",
					BackgroundColor: "#FF0000",
				},
			}),
			table.Transform(
				[]common.Transform{
					{
						Kind: common.JoinByColumValueKind,
						Spec: common.JoinByColumnValueSpec{
							Columns: []string{"instance"},
						},
					},
				},
			),
		),
		panel.AddQuery(
			query.PromQL(fmt.Sprintf("up{%s}", filter)),
		),
	)
}
