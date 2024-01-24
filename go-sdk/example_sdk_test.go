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

package sdk_test

import (
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"github.com/perses/perses/go-sdk"
	"github.com/perses/perses/go-sdk/datasources/prometheus"
	"github.com/perses/perses/go-sdk/http"
	"github.com/perses/perses/go-sdk/panels/markdown"
	prometheus_label_names "github.com/perses/perses/go-sdk/variables/prometheus-label-names"
	prometheus_label_values "github.com/perses/perses/go-sdk/variables/prometheus-label-values"
	prometheus_promql "github.com/perses/perses/go-sdk/variables/prometheus-promql"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

func Example_dashboardAsCode() {
	dash := sdk.NewDashboard("mysuperdashboard").WithDescription("example of a super dashboard as code")

	stackVar := sdk.NewListVariable("stack").
		WithPlugin(prometheus_label_values.NewLabelValuesVariablePlugin("stack").
			AddMatcher("thanos_build_info{}").Build()).
		Build()

	prometheusVar := sdk.NewTextVariable("prometheus").
		WithValue("platform").Constant(true).
		Build()

	prometheusNamespaceVar := sdk.NewTextVariable("prometheusNamespace").
		WithValue("observability").Constant(true).
		Build()

	namespaceVar := sdk.NewListVariable("namespace").
		WithPlugin(prometheus_promql.NewPromQLVariablePlugin("kube_namespace_labels").Build()). // TODO: filter labels
		WithMultipleValues(true).
		Build()

	namespaceLabelsVar := sdk.NewListVariable("namespaceLabels").
		WithPlugin(prometheus_label_names.NewLabelNamesVariablePlugin().AddMatcher("kube_namespace_labels{}").Build()). // TODO: filter labels
		WithMultipleValues(true).
		Build()

	podVar := sdk.NewListVariable("pod").
		WithPlugin(prometheus_promql.NewPromQLVariablePlugin("kube_pod_info").Build()). // TODO: filter labels
		WithAllValue(true).
		WithMultipleValues(true).
		Build()

	containerVar := sdk.NewListVariable("container").
		WithPlugin(prometheus_promql.NewPromQLVariablePlugin("kube_pod_container_info").Build()). // TODO: filter labels
		WithAllValue(true).
		WithMultipleValues(true).
		Build()

	containerLabelsVar := sdk.NewListVariable("containerLabels").
		WithDisplayDescription("zedzed").
		WithPlugin(prometheus_label_names.NewLabelNamesVariablePlugin().AddMatcher("kube_pod_container_info{}").Build()). // TODO: filter labels
		WithMultipleValues(true).
		Hidden(true).
		Build()

	dash.AddVariables(stackVar, prometheusVar, prometheusNamespaceVar, namespaceVar, namespaceLabelsVar, podVar, containerVar, containerLabelsVar)

	row := sdk.NewRow("system").Build()
	panel := sdk.NewPanel("test").WithPlugin(markdown.NewPanelPlugin("Hello world!").Build()).Build()
	dash.AddRow(row, []v1.Panel{panel, panel, panel, panel})

	datasourceURL := common.URL{
		&url.URL{
			Scheme: "https",
			Host:   "prometheus.demo.do.prometheus.io",
		},
	}
	datasource := sdk.NewDatasource("PrometheusDemo").
		WithPlugin(prometheus.NewDatasourcePlugin().
			WithScrapeInterval(30 * time.Second).
			WithProxy(http.NewHTTPProxy(datasourceURL).AddHeader("Authorization", "mytoken").Build()).
			Build())
	dash.AddDatasource(datasource.Build())

	client, err := sdk.NewClient("http://localhost:8080")
	if err != nil {
		fmt.Println(err)
		return
	}
	client, err = client.AuthWithUserPassword("a", "a")
	if err != nil {
		fmt.Println(err)
		return
	}

	err = client.UpsertToProject(dash, "testa")
	if err != nil {
		fmt.Println(err)
		return
	}
	return

	// TODO: examples SAVE IN LOCAL OR APPLY TO PERSES INSTANCE
	// OUTPUT DASHBOARD IN JSON
	raw, err := json.Marshal(dash)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(string(raw))
	// Output: {"kind":"Dashboard","metadata":{"name":"mysuperdashboard","createdAt":"0001-01-01T00:00:00Z","updatedAt":"0001-01-01T00:00:00Z","version":0,"project":""},"spec":{"display":{"description":"example of a super dashboard as code"},"datasources":{"prometheus":{"default":false,"plugin":{"kind":"HTTPProxy","spec":{"url":"https://prometheus.demo.do.prometheus.io"}}}},"panels":{"0_0":{"kind":"Panel","spec":{"display":{"name":"info"},"plugin":{"kind":"Markdown","spec":{"Text":"Hello world!"}}}}},"layouts":null,"duration":"0s"}}
}
