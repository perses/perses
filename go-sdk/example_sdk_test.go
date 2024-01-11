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
	"github.com/perses/perses/go-sdk/panels/markdown"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

func Example_dashboardAsCode() {
	dash := sdk.NewDashboard("mysuperdashboard").WithDescription("example of a super dashboard as code")

	row := sdk.NewRow("system").Build()
	panel := markdown.NewPanel("info", "Hello world!").Build()
	dash.AddRow(row, []v1.Panel{panel, panel, panel, panel})

	datasource := sdk.NewDatasource("prometheus")
	datasource, err := datasource.WithPrometheusHTTPProxy("https://prometheus.demo.do.prometheus.io")
	if err != nil {
		fmt.Println(err)
		return
	}
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
