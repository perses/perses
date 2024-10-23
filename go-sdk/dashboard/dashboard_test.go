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

package dashboard

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/perses/perses/go-sdk/datasource"
	"github.com/perses/perses/go-sdk/panel"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/perses/go-sdk/panel/table"
	timeseries "github.com/perses/perses/go-sdk/panel/time-series"
	promDs "github.com/perses/perses/go-sdk/prometheus/datasource"
	"github.com/perses/perses/go-sdk/prometheus/query"
	labelNamesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-names"
	labelValuesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-values"
	promqlVar "github.com/perses/perses/go-sdk/prometheus/variable/promql"
	mergeindexedcolumns "github.com/perses/perses/go-sdk/transform/merge-indexed-columns"
	variablegroup "github.com/perses/perses/go-sdk/variable-group"
	listVar "github.com/perses/perses/go-sdk/variable/list-variable"
	staticlist "github.com/perses/perses/go-sdk/variable/plugin/static-list"
	txtVar "github.com/perses/perses/go-sdk/variable/text-variable"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
						Kind: "Value",
						Spec: table.ValueConditionSpec{
							Value: "1",
						},
					},
					Text:            "UP",
					BackgroundColor: "#00FF00",
				},
				{
					Condition: table.Condition{
						Kind: "Value",
						Spec: table.ValueConditionSpec{
							Value: "0",
						},
					},
					Text:            "DOWN",
					BackgroundColor: "#FF0000",
				},
			}),
			table.AddTransform(
				mergeindexedcolumns.MergeIndexedColumns(
					mergeindexedcolumns.Column("instance"),
				),
			),
		),
		panel.AddQuery(
			query.PromQL(fmt.Sprintf("up{%s}", filter)),
		),
	)
}

func TestDashboardBuilder(t *testing.T) {
	builder, buildErr := New("ContainersMonitoring",
		Name("Containers monitoring"),
		ProjectName("MyProject"),

		// VARIABLES
		AddVariable("stack",
			listVar.List(
				labelValuesVar.PrometheusLabelValues("stack",
					labelValuesVar.Matchers("thanos_build_info{}"),
					labelValuesVar.Datasource("promDemo"),
				),
				listVar.DisplayName("PaaS"),
				listVar.CapturingRegexp("(.+)"),
			),
		),
		AddVariable("prometheus",
			txtVar.Text("platform", txtVar.Constant(true)),
		),
		AddVariable("prometheus_namespace",
			listVar.List(
				staticlist.StaticList(staticlist.Values("observability", "monitoring")),
				listVar.Description("to reduce the query scope thus improve performances"),
			),
		),
		AddVariable("namespace", listVar.List(
			promqlVar.PrometheusPromQL("group by (namespace) (kube_namespace_labels{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\"})", promqlVar.LabelName("namespace"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
		)),
		AddVariable("namespaceLabels", listVar.List(
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_namespace_labels{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\"}"),
				labelNamesVar.Datasource("promDemo"),
			),
		)),
		AddVariable("pod", listVar.List(
			promqlVar.PrometheusPromQL("group by (pod) (kube_pod_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\"})", promqlVar.LabelName("pod"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValue(true),
		)),
		AddVariable("container", listVar.List(
			promqlVar.PrometheusPromQL("group by (container) (kube_pod_container_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\",pod=~\"$pod\"})", promqlVar.LabelName("container"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValue(true),
			listVar.CustomAllValue(".*"),
		)),
		AddVariable("containerLabels", listVar.List(
			listVar.Description("simply the list of labels for the considered metric"),
			listVar.Hidden(true),
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_pod_container_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\",pod=~\"$pod\",container=~\"$container\"}"),
				labelNamesVar.Datasource("promDemo"),
			),
			listVar.SortingBy("alphabetical-ci-desc"),
		)),

		// PANEL GROUPS
		AddPanelGroup("Resource usage",
			panelgroup.PanelsPerLine(3),

			// PANELS
			buildMemoryPanel(""),
			buildCPUPanel(""),
		),
		AddPanelGroup("Resource usage bis",
			panelgroup.PanelsPerLine(1),
			panelgroup.PanelHeight(4),

			// PANELS
			buildCPUPanel(grouping),
			buildMemoryPanel(grouping),
		),
		AddPanelGroup("Misc",
			panelgroup.PanelsPerLine(1),

			// PANELS
			buildTargetStatusPanel(),
		),

		// DATASOURCES
		AddDatasource("myPromDemo",
			datasource.Default(true),
			promDs.Prometheus(
				promDs.DirectURL("http://localhost:9090"),
			),
		),

		// TIME
		Duration(3*time.Hour),
		RefreshInterval(30*time.Second),
	)

	builderOutput, marshErr := json.Marshal(builder.Dashboard)
	fmt.Println(string(builderOutput))
	outputJSONFilePath := filepath.Join("..", "..", "internal", "test", "dac", "expected_output.json")
	expectedOutput, readErr := os.ReadFile(outputJSONFilePath)

	t.Run("classic dashboard", func(t *testing.T) {
		assert.NoError(t, buildErr)
		assert.NoError(t, marshErr)
		assert.NoError(t, readErr)
		require.JSONEq(t, string(expectedOutput), string(builderOutput))
	})
}

func TestDashboardBuilderWithGroupedVariables(t *testing.T) {
	builder, buildErr := New("ContainersMonitoring",
		Name("Containers monitoring"),
		ProjectName("MyProject"),

		// VARIABLES
		AddVariableGroup(
			variablegroup.AddVariable("stack",
				listVar.List(
					labelValuesVar.PrometheusLabelValues("stack",
						labelValuesVar.Matchers("thanos_build_info"),
						labelValuesVar.Datasource("promDemo"),
					),
					listVar.DisplayName("PaaS"),
					listVar.CapturingRegexp("(.+)"),
				),
			),
			variablegroup.AddVariable("prometheus",
				txtVar.Text("platform", txtVar.Constant(true)),
			),
			variablegroup.AddVariable("prometheus_namespace",
				listVar.List(
					staticlist.StaticList(staticlist.Values("observability", "monitoring")),
					listVar.Description("to reduce the query scope thus improve performances"),
				),
			),
			variablegroup.AddVariable("namespace", listVar.List(
				promqlVar.PrometheusPromQL("group by (namespace) (kube_namespace_labels{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\"})", promqlVar.LabelName("namespace"), promqlVar.Datasource("promDemo")),
				listVar.AllowMultiple(true),
			)),
			variablegroup.AddIgnoredVariable("namespaceLabels", listVar.List(
				labelNamesVar.PrometheusLabelNames(
					labelNamesVar.Matchers("kube_namespace_labels"),
					labelNamesVar.Datasource("promDemo"),
				),
			)),
			variablegroup.AddVariable("pod", listVar.List(
				promqlVar.PrometheusPromQL("group by (pod) (kube_pod_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\"})", promqlVar.LabelName("pod"), promqlVar.Datasource("promDemo")),
				listVar.AllowMultiple(true),
				listVar.AllowAllValue(true),
			)),
			variablegroup.AddVariable("container", listVar.List(
				promqlVar.PrometheusPromQL("group by (container) (kube_pod_container_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\",pod=~\"$pod\"})", promqlVar.LabelName("container"), promqlVar.Datasource("promDemo")),
				listVar.AllowMultiple(true),
				listVar.AllowAllValue(true),
				listVar.CustomAllValue(".*"),
			)),
			variablegroup.AddIgnoredVariable("containerLabels", listVar.List(
				listVar.Description("simply the list of labels for the considered metric"),
				listVar.Hidden(true),
				labelNamesVar.PrometheusLabelNames(
					labelNamesVar.Matchers("kube_pod_container_info"),
					labelNamesVar.Datasource("promDemo"),
				),
				listVar.SortingBy("alphabetical-ci-desc"),
			)),
		),

		// PANEL GROUPS
		AddPanelGroup("Resource usage",
			panelgroup.PanelsPerLine(3),

			// PANELS
			buildMemoryPanel(""),
			buildCPUPanel(""),
		),
		AddPanelGroup("Resource usage bis",
			panelgroup.PanelsPerLine(1),
			panelgroup.PanelHeight(4),

			// PANELS
			buildCPUPanel(grouping),
			buildMemoryPanel(grouping),
		),
		AddPanelGroup("Misc",
			panelgroup.PanelsPerLine(1),

			// PANELS
			buildTargetStatusPanel(),
		),

		// DATASOURCES
		AddDatasource("myPromDemo",
			datasource.Default(true),
			promDs.Prometheus(
				promDs.DirectURL("http://localhost:9090"),
			),
		),

		// TIME
		Duration(3*time.Hour),
		RefreshInterval(30*time.Second),
	)

	builderOutput, marshErr := json.Marshal(builder.Dashboard)

	outputJSONFilePath := filepath.Join("..", "..", "internal", "test", "dac", "expected_output.json")
	expectedOutput, readErr := os.ReadFile(outputJSONFilePath)

	t.Run("dashboard with grouped variables", func(t *testing.T) {
		assert.NoError(t, buildErr)
		assert.NoError(t, marshErr)
		assert.NoError(t, readErr)
		require.JSONEq(t, string(expectedOutput), string(builderOutput))
	})
}
