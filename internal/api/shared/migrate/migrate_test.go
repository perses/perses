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

package migrate

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/perses/perses/internal/api/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrate(t *testing.T) {
	simpleGrafanaDashboard, _ := os.ReadFile("testdata/simple_grafana_dashboard.json")
	simplePersesDashboard, _ := os.ReadFile("testdata/simple_perses_dashboard.json")
	oldFormatGrafanaDashboard, _ := os.ReadFile("testdata/old_format_grafana_dashboard.json")
	oldFormatPersesDashboard, _ := os.ReadFile("testdata/old_format_perses_dashboard.json")

	testSuite := []struct {
		title            string
		initialDashboard []byte
		resultDashboard  []byte
		errMsg           string
	}{
		{
			title:            "grafana dashboard containing simple vars & panels",
			initialDashboard: simpleGrafanaDashboard,
			resultDashboard:  simplePersesDashboard,
			errMsg:           "",
		},
		{
			title:            "grafana dashboard containing old-formatted elements (text panels without `options` field & a legacy graph panel)",
			initialDashboard: oldFormatGrafanaDashboard,
			resultDashboard:  oldFormatPersesDashboard,
			errMsg:           "",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			svc, err := New(config.Schemas{
				// use the real schemas for these tests
				VariablesPath: "../../../../schemas/variables",
				PanelsPath:    "../../../../schemas/panels",
				QueriesPath:   "../../../../schemas/queries",
			})
			assert.NoError(t, err)

			persesDashboardStruct, err := svc.Migrate(test.initialDashboard)
			errString := ""
			if err != nil {
				errString = err.Error()
			}
			assert.Equal(t, test.errMsg, errString)

			persesDashboardJSON, _ := json.Marshal(persesDashboardStruct)
			require.JSONEq(t, string(test.resultDashboard), string(persesDashboardJSON))
		})
	}
}
