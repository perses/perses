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

	"github.com/perses/perses/go-sdk"
	"github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/http"
	"github.com/perses/perses/go-sdk/panel"
	"github.com/perses/perses/go-sdk/panel/bar"
	"github.com/perses/perses/go-sdk/panel/gauge"
	"github.com/perses/perses/go-sdk/panel/markdown"
	"github.com/perses/perses/go-sdk/panel/stat"
	"github.com/perses/perses/go-sdk/prometheus/datasource/prometheus"
	promTimeSeries "github.com/perses/perses/go-sdk/prometheus/panel/time-series"
	promQuery "github.com/perses/perses/go-sdk/prometheus/query/prometheus"
	"github.com/perses/perses/go-sdk/row"
)

func Example_dashboardAsCode() {

	dash, err := dashboard.New("mysuperdashboard",
		dashboard.ProjectName("testa"),
		dashboard.AddRow("section 1",
			row.Panel("test", markdown.Markdown("test")),
			row.Panel("test", markdown.Markdown("test")),
			row.Panel("test", markdown.Markdown("test")),
			row.Panel("test", markdown.Markdown("test")),
		),
		dashboard.AddDatasource("PrometheusDemo",
			prometheus.Prometheus(
				prometheus.DirectUrl("http://demo.prometheus.com"),
			),
		),
		dashboard.AddDatasource("PrometheusDemoWithProxy",
			prometheus.Prometheus(
				prometheus.HTTPProxy("http://demo.prometheus.com", http.AddHeader("Authorization", "Basic acide")),
			),
		),
		dashboard.AddRow("section 2",
			row.Panel("test", bar.BarChart()),
			row.Panel("test", gauge.GaugeChart()),
			row.Panel("test", stat.StatChart()),
			row.Panel("test",
				promTimeSeries.TimeSeries(
					promTimeSeries.WithLegend(promTimeSeries.Legend{
						Position: promTimeSeries.BottomPosition,
						Mode:     promTimeSeries.ListMode,
					}),
					promTimeSeries.Thresholds(common.Thresholds{
						Mode: common.PercentMode,
						Steps: []common.StepOption{
							{
								Value: 0,
								Color: "green",
							},
							{
								Value: 80,
								Color: "red",
							},
						},
					}),
					promTimeSeries.WithYAxis(promTimeSeries.YAxis{
						Format: &common.Format{
							Unit: string(common.PercentDecimalUnit),
						},
					}),
				),
				panel.AddQuery(
					promQuery.PromQL("sum by(instance) (irate(node_cpu_seconds_total{instance=\"$node\",job=\"$job\", mode=\"system\"}[$interval])) / on(instance) group_left sum by (instance)((irate(node_cpu_seconds_total{instance=\"$node\",job=\"$job\"}[$interval])))"),
				),
			),
		),
	)

	client, err := sdk.NewClient("http://localhost:8080")
	if err != nil {
		fmt.Println(err)
		return
	}
	client, err = client.AuthWithUserPassword("admin", "password")
	if err != nil {
		fmt.Println(err)
		return
	}

	err = client.UpsertToProject(&dash.Dashboard, "testa")
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
