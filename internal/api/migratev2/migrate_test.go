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
			title:                       "dashboard with table panels, focused on validating the migration of column settings",
			inputGrafanaDashboardFile:   "tables_grafana_dashboard.json",
			expectedPersesDashboardFile: "tables_perses_dashboard.json",
			expectedErrorStr:            "",
		},
	}
	projectPath := testUtils.GetRepositoryPath()

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			inputGrafanaDashboardRaw := testUtils.ReadFile(filepath.Join(testDataFolder, test.inputGrafanaDashboardFile))
			expectedPersesDashboard := unmarshalStrictPersesDashboard(testUtils.ReadFile(filepath.Join(testDataFolder, test.expectedPersesDashboardFile)))
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
			assert.Equal(t, expectedPersesDashboard, dashboard)
		})
	}
}
