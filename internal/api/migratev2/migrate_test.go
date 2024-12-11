package migratev2

import (
	"encoding/json"
	"path/filepath"
	"testing"

	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

const testDataFolder = "testdata"

func unmarshalStrictPersesDashboard(data []byte) *v1.Dashboard {
	result := &v1.Dashboard{}
	if err := json.Unmarshal(data, result); err != nil {
		panic(err)
	}
	return result
}

func TestMig_Migrate(t *testing.T) {
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
		{
			title:                       "dashboard from user",
			inputGrafanaDashboardFile:   "grafana_user_grafana_dashboard.json",
			expectedPersesDashboardFile: "grafana_user_perses_dashboard.json",
			expectedErrorStr:            "",
		},
	}
	projectPath := testUtils.GetRepositoryPath()

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			inputGrafanaDashboardRaw := testUtils.ReadFile(filepath.Join(testDataFolder, test.inputGrafanaDashboardFile))
			expectedPersesDashboardRaw := testUtils.ReadFile(filepath.Join(testDataFolder, test.expectedPersesDashboardFile))
			m, err := create(config.Schemas{
				PanelsPath:    filepath.Join(projectPath, "cue", config.DefaultPanelsPath),
				QueriesPath:   filepath.Join(projectPath, "cue", config.DefaultQueriesPath),
				VariablesPath: filepath.Join(projectPath, "cue", config.DefaultVariablesPath),
			})
			if err != nil {
				t.Fatal(err)
			}
			grafanaDashboard := &SimplifiedDashboard{}
			if unmarshallErr := json.Unmarshal(inputGrafanaDashboardRaw, grafanaDashboard); unmarshallErr != nil {
				t.Fatal(unmarshallErr)
			}
			dashboard, err := m.Migrate(grafanaDashboard)
			if err != nil {
				t.Fatal(err)
			}
			raw := testUtils.JSONMarshalStrict(dashboard)
			assert.JSONEq(t, string(expectedPersesDashboardRaw), string(raw))
		})
	}
}
