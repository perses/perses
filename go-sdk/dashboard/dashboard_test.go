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

	"github.com/perses/perses/go-sdk/panel"
	timeSeriesPanel "github.com/perses/perses/go-sdk/prometheus/panel/time-series"
	"github.com/perses/perses/go-sdk/prometheus/query/prometheus"
	labelNamesVar "github.com/perses/perses/go-sdk/prometheus/variable/prometheus-label-names"
	labelValuesVar "github.com/perses/perses/go-sdk/prometheus/variable/prometheus-label-values"
	promqlVar "github.com/perses/perses/go-sdk/prometheus/variable/prometheus-promql"
	"github.com/perses/perses/go-sdk/row"
	listVar "github.com/perses/perses/go-sdk/variable/list-variable"
	txtVar "github.com/perses/perses/go-sdk/variable/text-variable"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDashboardBuilder(t *testing.T) {
	builder, buildErr := New("ContainersMonitoring",
		ProjectName("MyProject"),

		// VARIABLES
		AddVariable("stack",
			listVar.List(
				labelValuesVar.PrometheusLabelValues("stack",
					labelValuesVar.Matchers("thanos_build_info"),
					labelValuesVar.Datasource("promDemo"),
				),
				listVar.DisplayName("PaaS"),
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
			promqlVar.PrometheusPromQL("kube_namespace_labels", "namespace", promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
		)),
		AddVariable("namespaceLabels", listVar.List(
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_namespace_labels"),
				labelNamesVar.Datasource("promDemo"),
			),
			listVar.AllowMultiple(true),
		)),
		AddVariable("pod", listVar.List(
			promqlVar.PrometheusPromQL("kube_pod_info", "pod", promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValues(true),
		)),
		AddVariable("container", listVar.List(
			promqlVar.PrometheusPromQL("kube_pod_container_info", "container", promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValues(true),
		)),
		AddVariable("containerLabels", listVar.List(
			listVar.Description("simply the list of labels for the considered metric"),
			listVar.Hidden(true),
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_pod_container_info"),
				labelNamesVar.Datasource("promDemo"),
			),
			listVar.AllowMultiple(true),
		)),

		// ROWS
		AddRow("Resource usage",
			row.PanelsPerLine(3),

			// PANELS
			row.Panel("Container memory",
				timeSeriesPanel.TimeSeries(),
				panel.AddQuery(
					prometheus.PromQL("max (this.#aggr) (container_memory_rss{(this.#filter)})"), // TODO: fix
				),
			),
			row.Panel("Container CPU",
				timeSeriesPanel.TimeSeries(),
				panel.AddQuery(
					prometheus.PromQL("sum (this.#aggr) (container_cpu_usage_seconds{(this.#filter)})"), // TODO: fix
				),
			),
		),
	)

	builderOutput, marshErr := json.Marshal(builder.Dashboard)

	outputJSONFilePath := filepath.Join("../", "../", "internal", "test", "dac", "expected_output.json")
	expectedOutput, readErr := os.ReadFile(outputJSONFilePath)

	testSuites := []struct {
		title          string
		sdkResult      string
		expectedResult string
		expectedError  bool
	}{
		{
			title:          "full dashboard",
			sdkResult:      string(builderOutput),
			expectedResult: string(expectedOutput),
		},
	}
	for i := range testSuites {
		test := testSuites[i]
		t.Run(test.title, func(t *testing.T) {
			fmt.Println(fmt.Sprintf("%s", expectedOutput))
			fmt.Println(fmt.Sprintf("%s", builderOutput))

			if test.expectedError {
				assert.NotNil(t, buildErr)
			} else {
				assert.NoError(t, buildErr)
				assert.NoError(t, marshErr)
				assert.NoError(t, readErr)
				require.JSONEq(t, test.expectedResult, test.sdkResult)
			}
		})
	}
}
