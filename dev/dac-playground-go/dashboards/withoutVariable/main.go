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

package main

import (
	"time"

	"example.com/m/mylibrary/panels"
	sdk "github.com/perses/perses/go-sdk"
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/datasource"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	promDs "github.com/perses/plugins/prometheus/sdk/go/datasource"
)

func main() {
	exec := sdk.NewExec()
	exec.BuildDashboard(
		dashboard.New("withoutVariable",
			dashboard.ProjectName("MyProject"),
			dashboard.Name("Without Variable"),

			// PANELS only (no variables library imported)
			dashboard.AddPanelGroup("Resources usage",
				panelgroup.PanelsPerLine(3),
				panelgroup.Collapsed(true),
				panels.CPUUsage(),

				panels.MemoryUsage(),
				panels.MemoryUsage2(),
			),

			// PANELS only (no variables library imported)
			dashboard.AddPanelGroup("Something else",
				panelgroup.PanelsPerLine(2),
				panelgroup.Collapsed(false),
				panels.CPUUsage(),
				panels.MemoryUsage(),
			),

			// PANELS only (no variables library imported)
			dashboard.AddPanelGroup("Resources usage",
				panelgroup.PanelsPerLine(3),
				panels.CPUUsage(),
				panels.MemoryUsage(),
				panels.MemoryUsage2(),
			),

			// DATASOURCE
			dashboard.AddDatasource("promDemo",
				datasource.Default(false),
				promDs.Prometheus(
					promDs.DirectURL("http://localhost:9090"),
				),
			),

			// TIME
			dashboard.Duration(2*time.Hour),
		),
	)
}
