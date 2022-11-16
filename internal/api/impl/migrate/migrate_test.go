// Copyright 2022 The Perses Authors
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
	grafanaDashboard, _ := os.ReadFile("testdata/grafana_dashboard.json")
	resultDashboard, _ := os.ReadFile("testdata/perses_dashboard.json")

	testSuite := []struct {
		title            string
		grafanaDashboard []byte
		resultDashboard  []byte
		errMsg           string
	}{
		{
			title:            "grafana dashboard containing simple vars & panels",
			grafanaDashboard: grafanaDashboard,
			resultDashboard:  resultDashboard,
			errMsg:           "",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			migrateEndpoint := New(config.Schemas{
				// use the real schemas for these tests
				VariablesPath: "../../../../schemas/variables",
				PanelsPath:    "../../../../schemas/panels",
				QueriesPath:   "../../../../schemas/queries",
			})

			persesDashboardStruct, err := migrateEndpoint.migrate(test.grafanaDashboard)
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
