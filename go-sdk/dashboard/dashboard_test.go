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
	"os"
	"path/filepath"
	"testing"

	"github.com/perses/perses/go-sdk/panel"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	timeseries "github.com/perses/perses/go-sdk/panel/time-series"
	"github.com/perses/perses/go-sdk/prometheus/query"
	labelNamesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-names"
	labelValuesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-values"
	promqlVar "github.com/perses/perses/go-sdk/prometheus/variable/promql"
	variablegroup "github.com/perses/perses/go-sdk/variable-group"
	listVar "github.com/perses/perses/go-sdk/variable/list-variable"
	txtVar "github.com/perses/perses/go-sdk/variable/text-variable"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	memoryPanel = panelgroup.AddPanel("Container memory",
		timeseries.Chart(),
		panel.AddQuery(
			query.PromQL("max by (container) (container_memory_rss{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"})"),
		),
	)

	cpuPanel = panelgroup.AddPanel("Container CPU",
		timeseries.Chart(),
		panel.AddQuery(
			query.PromQL("sum  (container_cpu_usage_seconds{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"})"),
		),
	)
)

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
			txtVar.Text("observability",
				txtVar.Constant(true),
				txtVar.Description("constant to reduce the query scope thus improve performances"),
			),
		),
		AddVariable("namespace", listVar.List(
			promqlVar.PrometheusPromQL("group by (namespace) (kube_namespace_labels{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\"})", promqlVar.LabelName("namespace"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
		)),
		AddVariable("namespaceLabels", listVar.List(
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_namespace_labels{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\"}"),
				labelNamesVar.Datasource("promDemo"),
			),
		)),
		AddVariable("pod", listVar.List(
			promqlVar.PrometheusPromQL("group by (pod) (kube_pod_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\"})", promqlVar.LabelName("pod"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValue(true),
		)),
		AddVariable("container", listVar.List(
			promqlVar.PrometheusPromQL("group by (container) (kube_pod_container_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\"})", promqlVar.LabelName("container"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValue(true),
			listVar.CustomAllValue(".*"),
		)),
		AddVariable("containerLabels", listVar.List(
			listVar.Description("simply the list of labels for the considered metric"),
			listVar.Hidden(true),
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_pod_container_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"}"),
				labelNamesVar.Datasource("promDemo"),
			),
			listVar.SortingBy("alphabetical-ci-desc"),
		)),

		// PANEL GROUPS
		AddPanelGroup("Resource usage",
			panelgroup.PanelsPerLine(3),

			// PANELS
			memoryPanel,
			cpuPanel,
		),
		AddPanelGroup("Resource usage bis",
			panelgroup.PanelsPerLine(1),
			panelgroup.PanelHeight(4),

			// PANELS
			cpuPanel,
			memoryPanel,
		),
	)

	builderOutput, marshErr := json.Marshal(builder.Dashboard)

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
				txtVar.Text("observability",
					txtVar.Constant(true),
					txtVar.Description("constant to reduce the query scope thus improve performances"),
				),
			),
			variablegroup.AddVariable("namespace", listVar.List(
				promqlVar.PrometheusPromQL("group by (namespace) (kube_namespace_labels{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\"})", promqlVar.LabelName("namespace"), promqlVar.Datasource("promDemo")),
				listVar.AllowMultiple(true),
			)),
			variablegroup.AddIgnoredVariable("namespaceLabels", listVar.List(
				labelNamesVar.PrometheusLabelNames(
					labelNamesVar.Matchers("kube_namespace_labels"),
					labelNamesVar.Datasource("promDemo"),
				),
			)),
			variablegroup.AddVariable("pod", listVar.List(
				promqlVar.PrometheusPromQL("group by (pod) (kube_pod_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\"})", promqlVar.LabelName("pod"), promqlVar.Datasource("promDemo")),
				listVar.AllowMultiple(true),
				listVar.AllowAllValue(true),
			)),
			variablegroup.AddVariable("container", listVar.List(
				promqlVar.PrometheusPromQL("group by (container) (kube_pod_container_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\"})", promqlVar.LabelName("container"), promqlVar.Datasource("promDemo")),
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
			memoryPanel,
			cpuPanel,
		),
		AddPanelGroup("Resource usage bis",
			panelgroup.PanelsPerLine(1),
			panelgroup.PanelHeight(4),

			// PANELS
			cpuPanel,
			memoryPanel,
		),
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
