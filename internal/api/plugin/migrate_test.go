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

// /!\ this file is not located under migrate/ in order to avoid an import cycle

package plugin

import (
	"encoding/json"
	"path/filepath"
	"testing"

	"github.com/perses/perses/internal/api/plugin/migrate"
	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

const testDataFolder = "testdata"

// LoadTestPlugins is a helper function that loads the dummy plugins from testdata
func LoadTestPlugins() Plugin {
	cfg := config.Plugin{
		Path:        filepath.Join("migrate", testDataFolder, "plugins"),
		ArchivePath: "unused",
	}
	pluginService := New(cfg)
	if err := pluginService.Load(); err != nil {
		logrus.Fatal(err)
	}
	return pluginService
}

func TestMig_Migrate(t *testing.T) {
	testSuite := []struct {
		title                       string
		inputGrafanaDashboardFile   string
		expectedPersesDashboardFile string
	}{
		{
			title:                       "basic dashboard with few vars & panels",
			inputGrafanaDashboardFile:   "basic_grafana_dashboard.json",
			expectedPersesDashboardFile: "basic_perses_dashboard.json",
		},
		{
			title:                       "dashboard without panels should be migrated without error",
			inputGrafanaDashboardFile:   "empty_panels_list_grafana_dashboard.json",
			expectedPersesDashboardFile: "empty_panels_list_perses_dashboard.json",
		},
		{
			title:                       "dashboard embedding a library panel",
			inputGrafanaDashboardFile:   "library_panel_grafana_dashboard.json",
			expectedPersesDashboardFile: "library_panel_perses_dashboard.json",
		},
	}

	pl := LoadTestPlugins()

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			input := testUtils.ReadFile(filepath.Join("migrate", testDataFolder, "dashboards", test.inputGrafanaDashboardFile))
			expected := testUtils.ReadFile(filepath.Join("migrate", testDataFolder, "dashboards", test.expectedPersesDashboardFile))
			grafanaDashboard := &migrate.SimplifiedDashboard{}
			if unmarshallErr := json.Unmarshal(input, grafanaDashboard); unmarshallErr != nil {
				t.Fatal(unmarshallErr)
			}
			persesDashboard, err := pl.Migration().Migrate(grafanaDashboard)
			if err != nil {
				t.Fatal(err)
			}
			output := testUtils.JSONMarshalStrict(persesDashboard)
			assert.JSONEq(t, string(expected), string(output))
		})
	}
}
