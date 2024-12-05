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
	"fmt"
	"os"
	"path/filepath"
	"testing"

	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testDataFolder = "testdata"

func TestMigrate(t *testing.T) {

	testSuite := []struct {
		title                       string
		inputGrafanaDashboardFile   string
		expectedPersesDashboardFile string
		expectedErrorStr            string
	}{
		{
			title:                       "dashboard with simple vars & panels",
			inputGrafanaDashboardFile:   "simple_grafana_dashboard.json",
			expectedPersesDashboardFile: "simple_perses_dashboard.json",
			expectedErrorStr:            "",
		},
		{
			title:                       "dashboard with old-formatted elements (text panels without `options` field & a legacy graph panel)",
			inputGrafanaDashboardFile:   "old_grafana_panels_grafana_dashboard.json",
			expectedPersesDashboardFile: "old_grafana_panels_perses_dashboard.json",
			expectedErrorStr:            "",
		},
		{
			title:                       "dashboard embedding a library panel",
			inputGrafanaDashboardFile:   "library_panel_grafana_dashboard.json",
			expectedPersesDashboardFile: "library_panel_perses_dashboard.json",
			expectedErrorStr:            "",
		},
		{
			title:                       "dashboard with old query format used (i.e query string instead of struct with query + refId)",
			inputGrafanaDashboardFile:   "old_grafana_query_grafana_dashboard.json",
			expectedPersesDashboardFile: "old_grafana_query_perses_dashboard.json",
			expectedErrorStr:            "",
		},
		{
			title:                       "dashboard without panels should be migrated without error",
			inputGrafanaDashboardFile:   "empty_panels_list_grafana_dashboard.json",
			expectedPersesDashboardFile: "empty_panels_list_perses_dashboard.json",
			expectedErrorStr:            "",
		},
		{
			title:                       "dashboard with table panels, focused on validating the migration of column settings",
			inputGrafanaDashboardFile:   "tables_grafana_dashboard.json",
			expectedPersesDashboardFile: "tables_perses_dashboard.json",
			expectedErrorStr:            "",
		},
		{
			title:                       "dashboard with a stat panel that has undefined reduceOptions",
			inputGrafanaDashboardFile:   "stat_calc_undefined_grafana_dashboard.json",
			expectedPersesDashboardFile: "stat_calc_undefined_perses_dashboard.json",
			expectedErrorStr:            "",
		},
		{
			title:                       "dashboard with a bar gauge",
			inputGrafanaDashboardFile:   "barchart_grafana_dashboard.json",
			expectedPersesDashboardFile: "barchart_perses_dashboard.json",
			expectedErrorStr:            "",
		},
		{
			title:                       "dashboard with a piechart",
			inputGrafanaDashboardFile:   "piechart_grafana_dashboard.json",
			expectedPersesDashboardFile: "piechart_perses_dashboard.json",
			expectedErrorStr:            "",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			inputGrafanaDashboardRaw := testUtils.ReadFile(filepath.Join(testDataFolder, test.inputGrafanaDashboardFile))
			expectedPersesDashboardRaw := testUtils.ReadFile(filepath.Join(testDataFolder, test.expectedPersesDashboardFile))

			projectPath := testUtils.GetRepositoryPath()
			svc, err := New(config.Schemas{
				// use the real schemas for these tests
				PanelsPath:    filepath.Join(projectPath, "cue", config.DefaultPanelsPath),
				QueriesPath:   filepath.Join(projectPath, "cue", config.DefaultQueriesPath),
				VariablesPath: filepath.Join(projectPath, "cue", config.DefaultVariablesPath),
			})
			assert.NoError(t, err)

			actualPersesDashboard, err := svc.Migrate(inputGrafanaDashboardRaw)

			actualErrorStr := ""
			if err != nil {
				actualErrorStr = err.Error()
			}
			assert.Equal(t, test.expectedErrorStr, actualErrorStr)

			actualPersesDashboardRaw := testUtils.JSONMarshalStrict(actualPersesDashboard)
			fmt.Print(string(actualPersesDashboardRaw))
			require.JSONEq(t, string(expectedPersesDashboardRaw), string(actualPersesDashboardRaw))
		})
	}
}

func TestRearrangeGrafanaPanelsWithinExpandedRows(t *testing.T) {
	input, _ := os.ReadFile("testdata/expanded_rows_before.json")
	expectedAfter, _ := os.ReadFile("testdata/expanded_rows_after.json")

	t.Run("It should move any wrongly-orphaned panels into the right expanded row", func(t *testing.T) {
		actualAfter := rearrangeGrafanaPanelsWithinExpandedRows(input)
		require.JSONEq(t, string(expectedAfter), string(actualAfter))
	})
}
