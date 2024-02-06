// Copyright 2023 The Perses Authors
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

package main

import (
	"github.com/perses/perses/go-sdk"
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/panel"
	"github.com/perses/perses/go-sdk/prometheus/query"
	"github.com/perses/perses/go-sdk/row"

	timeSeriesPanel "github.com/perses/perses/go-sdk/panel/time-series"
	promDs "github.com/perses/perses/go-sdk/prometheus/datasource"
	labelNamesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-names"
	labelValuesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-values"
	promqlVar "github.com/perses/perses/go-sdk/prometheus/variable/promql"
	listVar "github.com/perses/perses/go-sdk/variable/list-variable"
	txtVar "github.com/perses/perses/go-sdk/variable/text-variable"
)

func main() {
	builder, buildErr := dashboard.New("ContainersMonitoring",
		dashboard.ProjectName("MyProject"),

		// VARIABLES
		dashboard.AddVariable("stack",
			listVar.List(
				labelValuesVar.PrometheusLabelValues("stack",
					labelValuesVar.Matchers("thanos_build_info{}"),
					labelValuesVar.Datasource("promDemo"),
				),
				listVar.DisplayName("PaaS"),
			),
		),
		dashboard.AddVariable("prometheus",
			txtVar.Text("platform", txtVar.Constant(true)),
		),
		dashboard.AddVariable("prometheus_namespace",
			txtVar.Text("observability",
				txtVar.Constant(true),
				txtVar.Description("constant to reduce the query scope thus improve performances"),
			),
		),
		dashboard.AddVariable("namespace", listVar.List(
			promqlVar.PrometheusPromQL("group by (namespace) (kube_namespace_labels{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\"})", "namespace", promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
		)),
		dashboard.AddVariable("namespaceLabels", listVar.List(
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_namespace_labels{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\"}"),
				labelNamesVar.Datasource("promDemo"),
			),
		)),
		dashboard.AddVariable("pod", listVar.List(
			promqlVar.PrometheusPromQL("group by (pod) (kube_pod_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\"})", "pod", promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValues(true),
		)),
		dashboard.AddVariable("container", listVar.List(
			promqlVar.PrometheusPromQL("group by (container) (kube_pod_container_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\"})", "container", promqlVar.Datasource("promDemo")),
			listVar.AllowMultiple(true),
			listVar.AllowAllValues(true),
		)),
		dashboard.AddVariable("containerLabels", listVar.List(
			listVar.Description("simply the list of labels for the considered metric"),
			listVar.Hidden(true),
			labelNamesVar.PrometheusLabelNames(
				labelNamesVar.Matchers("kube_pod_container_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"}"),
				labelNamesVar.Datasource("promDemo"),
			),
		)),

		// ROWS
		dashboard.AddRow("Resource usage",
			row.PanelsPerLine(3),

			// PANELS
			row.Panel("Container memory",
				timeSeriesPanel.Chart(),
				panel.AddQuery(
					query.PromQL("max by (container) (container_memory_rss{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"})"),
				),
			),
			row.Panel("Container CPU",
				timeSeriesPanel.Chart(),
				panel.AddQuery(
					query.PromQL("sum  (container_cpu_usage_seconds{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"})"),
				),
			),
		),

		dashboard.AddDatasource("promDemo", promDs.Prometheus(promDs.HTTPProxy("#####"))),
	)
	sdk.ExecuteDashboard(builder, buildErr)
}
