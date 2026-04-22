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

package dac

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/datasource"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	variablegroup "github.com/perses/perses/go-sdk/variable-group"
	listVar "github.com/perses/perses/go-sdk/variable/list-variable"
	txtVar "github.com/perses/perses/go-sdk/variable/text-variable"
	promDs "github.com/perses/plugins/prometheus/sdk/go/datasource"
	labelNamesVar "github.com/perses/plugins/prometheus/sdk/go/variable/label-names"
	labelValuesVar "github.com/perses/plugins/prometheus/sdk/go/variable/label-values"
	promqlVar "github.com/perses/plugins/prometheus/sdk/go/variable/promql"
	staticlist "github.com/perses/plugins/staticlistvariable/sdk/go"
	dashboardSpec "github.com/perses/spec/go/dashboard"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDashboardBuilder(t *testing.T) {
	builder, buildErr := dashboard.New("ContainersMonitoring",
		dashboard.Name("Containers monitoring"),
		dashboard.ProjectName("MyProject"),
		dashboard.Description("A dashboard to monitor containers"),

		// VARIABLES
		dashboard.AddVariable("stack",
			listVar.List(
				labelValuesVar.PrometheusLabelValues("stack",
					labelValuesVar.Matchers("thanos_build_info{}"),
					labelValuesVar.Datasource("promDemo"),
				),
				listVar.DisplayName("PaaS"),
				listVar.CapturingRegexp("(.+)"),
			),
		),
		dashboard.AddVariable("prometheus",
			txtVar.Text("platform", txtVar.Constant(true)),
		),
		dashboard.AddVariable("prometheus_namespace",
			listVar.List(
				staticlist.StaticList(staticlist.Values("observability", "monitoring")),
				listVar.Description("to reduce the query scope thus improve performances"),
			),
		),
		dashboard.AddVariable("namespace", listVar.List(
			promqlVar.PrometheusPromQL("group by (namespace) (kube_namespace_labels{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\"})", promqlVar.LabelName("namespace"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
		)),
		dashboard.AddVariable("namespaceLabels", listVar.List(
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_namespace_labels{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\"}"),
				labelNamesVar.Datasource("promDemo"),
			),
		)),
		dashboard.AddVariable("pod", listVar.List(
			promqlVar.PrometheusPromQL("group by (pod) (kube_pod_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\"})", promqlVar.LabelName("pod"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValue(true),
		)),
		dashboard.AddVariable("container", listVar.List(
			promqlVar.PrometheusPromQL("group by (container) (kube_pod_container_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\",pod=~\"$pod\"})", promqlVar.LabelName("container"), promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValue(true),
			listVar.CustomAllValue(".*"),
		)),
		dashboard.AddVariable("containerLabels", listVar.List(
			listVar.Description("simply the list of labels for the considered metric"),
			listVar.Hidden(true),
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_pod_container_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\",pod=~\"$pod\",container=~\"$container\"}"),
				labelNamesVar.Datasource("promDemo"),
			),
			listVar.SortingBy("alphabetical-ci-desc"),
		)),

		// PANEL GROUPS
		dashboard.AddPanelGroup("Resource usage",
			panelgroup.PanelsPerLine(3),

			// PANELS
			buildMemoryPanel(""),
			buildCPUPanel(""),
		),
		dashboard.AddPanelGroup("Resource usage bis",
			panelgroup.PanelsPerLine(1),
			panelgroup.PanelHeight(4),

			// PANELS
			buildCPUPanel(grouping),
			buildMemoryPanel(grouping),
		),
		dashboard.AddPanelGroup("Misc",
			panelgroup.PanelsPerLine(1),

			// PANELS
			buildTargetStatusPanel(),
		),

		// DATASOURCES
		dashboard.AddDatasource("myPromDemo",
			datasource.Default(true),
			promDs.Prometheus(
				promDs.DirectURL("http://localhost:9090"),
			),
		),

		// TIME
		dashboard.Duration(3*time.Hour),
		dashboard.RefreshInterval(30*time.Second),
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
	builder, buildErr := dashboard.New("ContainersMonitoring",
		dashboard.Name("Containers monitoring"),
		dashboard.ProjectName("MyProject"),
		dashboard.Description("A dashboard to monitor containers"),

		// VARIABLES
		dashboard.AddVariableGroup(
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
		dashboard.AddPanelGroup("Resource usage",
			panelgroup.PanelsPerLine(3),

			// PANELS
			buildMemoryPanel(""),
			buildCPUPanel(""),
		),
		dashboard.AddPanelGroup("Resource usage bis",
			panelgroup.PanelsPerLine(1),
			panelgroup.PanelHeight(4),

			// PANELS
			buildCPUPanel(grouping),
			buildMemoryPanel(grouping),
		),
		dashboard.AddPanelGroup("Misc",
			panelgroup.PanelsPerLine(1),

			// PANELS
			buildTargetStatusPanel(),
		),

		// DATASOURCES
		dashboard.AddDatasource("myPromDemo",
			datasource.Default(true),
			promDs.Prometheus(
				promDs.DirectURL("http://localhost:9090"),
			),
		),

		// TIME
		dashboard.Duration(3*time.Hour),
		dashboard.RefreshInterval(30*time.Second),
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

func TestAddCustomPanelGroup(t *testing.T) {
	t.Run("single panel with custom position", func(t *testing.T) {
		builder, err := dashboard.New("test-dashboard",
			dashboard.ProjectName("test"),
			dashboard.AddCustomPanelGroup("My Group",
				[]dashboard.GridItem{{X: 0, Y: 0, W: 24, H: 6}},
				panelgroup.AddPanel("Panel A"),
			),
		)

		require.NoError(t, err)

		require.Len(t, builder.Dashboard.Spec.Layouts, 1)
		layout := builder.Dashboard.Spec.Layouts[0]
		assert.Equal(t, dashboardSpec.LayoutKind("Grid"), layout.Kind)

		spec, ok := layout.Spec.(dashboardSpec.GridLayoutSpec)
		require.True(t, ok)
		assert.Equal(t, "My Group", spec.Display.Title)
		assert.Nil(t, spec.Display.Collapse)

		require.Len(t, spec.Items, 1)
		assert.Equal(t, 0, spec.Items[0].X)
		assert.Equal(t, 0, spec.Items[0].Y)
		assert.Equal(t, 24, spec.Items[0].Width)
		assert.Equal(t, 6, spec.Items[0].Height)
		assert.Equal(t, "#/spec/panels/0_0", spec.Items[0].Content.Ref)

		require.Len(t, builder.Dashboard.Spec.Panels, 1)
		assert.Contains(t, builder.Dashboard.Spec.Panels, "0_0")
	})

	t.Run("multiple panels with different positions", func(t *testing.T) {
		builder, err := dashboard.New("test-dashboard",
			dashboard.ProjectName("test"),
			dashboard.AddCustomPanelGroup("Multi Panel Group",
				[]dashboard.GridItem{
					{X: 0, Y: 0, W: 12, H: 8},
					{X: 12, Y: 0, W: 12, H: 8},
					{X: 0, Y: 8, W: 24, H: 4},
				},
				panelgroup.AddPanel("Panel A"),
				panelgroup.AddPanel("Panel B"),
				panelgroup.AddPanel("Panel C"),
			),
		)

		require.NoError(t, err)
		require.Len(t, builder.Dashboard.Spec.Layouts, 1)

		spec, ok := builder.Dashboard.Spec.Layouts[0].Spec.(dashboardSpec.GridLayoutSpec)
		require.True(t, ok)
		require.Len(t, spec.Items, 3)

		// First panel: top-left half
		assert.Equal(t, 0, spec.Items[0].X)
		assert.Equal(t, 0, spec.Items[0].Y)
		assert.Equal(t, 12, spec.Items[0].Width)
		assert.Equal(t, 8, spec.Items[0].Height)

		// Second panel: top-right half
		assert.Equal(t, 12, spec.Items[1].X)
		assert.Equal(t, 0, spec.Items[1].Y)
		assert.Equal(t, 12, spec.Items[1].Width)
		assert.Equal(t, 8, spec.Items[1].Height)

		// Third panel: full width below
		assert.Equal(t, 0, spec.Items[2].X)
		assert.Equal(t, 8, spec.Items[2].Y)
		assert.Equal(t, 24, spec.Items[2].Width)
		assert.Equal(t, 4, spec.Items[2].Height)

		// Verify all panels stored
		require.Len(t, builder.Dashboard.Spec.Panels, 3)
		assert.Contains(t, builder.Dashboard.Spec.Panels, "0_0")
		assert.Contains(t, builder.Dashboard.Spec.Panels, "0_1")
		assert.Contains(t, builder.Dashboard.Spec.Panels, "0_2")
	})

	t.Run("panel refs use correct layout index with multiple groups", func(t *testing.T) {
		builder, err := dashboard.New("test-dashboard",
			dashboard.ProjectName("test"),
			dashboard.AddCustomPanelGroup("Group 1",
				[]dashboard.GridItem{{X: 0, Y: 0, W: 24, H: 6}},
				panelgroup.AddPanel("Panel 1"),
			),
			dashboard.AddCustomPanelGroup("Group 2",
				[]dashboard.GridItem{{X: 0, Y: 0, W: 24, H: 6}},
				panelgroup.AddPanel("Panel 2"),
			),
		)

		require.NoError(t, err)
		require.Len(t, builder.Dashboard.Spec.Layouts, 2)

		// First group panels keyed as "0_0"
		assert.Contains(t, builder.Dashboard.Spec.Panels, "0_0")
		spec0, ok := builder.Dashboard.Spec.Layouts[0].Spec.(dashboardSpec.GridLayoutSpec)
		require.True(t, ok)
		assert.Equal(t, "#/spec/panels/0_0", spec0.Items[0].Content.Ref)

		// Second group panels keyed as "1_0"
		assert.Contains(t, builder.Dashboard.Spec.Panels, "1_0")
		spec1, ok := builder.Dashboard.Spec.Layouts[1].Spec.(dashboardSpec.GridLayoutSpec)
		require.True(t, ok)
		assert.Equal(t, "#/spec/panels/1_0", spec1.Items[0].Content.Ref)
	})
}

func TestDashboardNewWithInvalidMetadataName(t *testing.T) {
	inputName := "Space in title"

	builder, err := dashboard.New(inputName,
		dashboard.ProjectName("MyProject"),
	)

	assert.Error(t, err)
	assert.Equal(t, inputName, builder.Dashboard.Metadata.Name)
}
