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

package validate

import (
	"path/filepath"
	"testing"

	"github.com/perses/perses/internal/api/shared/schemas"
	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

const testDataFolder = "testdata"

func TestDashboard(t *testing.T) {

	testSuite := []struct {
		title            string
		dashboardFile    string
		expectedErrorStr string
	}{
		{
			title:            "dashboard with variables queries mixing parent variable & regex",
			dashboardFile:    "dashboard_with_regex_in_variable.json",
			expectedErrorStr: "",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			persesDashboardRaw := testUtils.ReadFile(filepath.Join(testDataFolder, test.dashboardFile))

			projectPath := testUtils.GetRepositoryPath()
			schemasService, schErr := schemas.New(config.Schemas{
				// use the real schemas for these tests
				PanelsPath:      filepath.Join(projectPath, config.DefaultPanelsPath),
				QueriesPath:     filepath.Join(projectPath, config.DefaultQueriesPath),
				DatasourcesPath: filepath.Join(projectPath, config.DefaultDatasourcesPath),
				VariablesPath:   filepath.Join(projectPath, config.DefaultVariablesPath),
			})
			if schErr != nil {
				t.Fatal(schErr)
			}

			var persesDashboard modelV1.Dashboard
			testUtils.JSONUnmarshal(persesDashboardRaw, &persesDashboard)

			err := Dashboard(&persesDashboard, schemasService)

			actualErrorStr := ""
			if err != nil {
				actualErrorStr = err.Error()
			}
			assert.Equal(t, test.expectedErrorStr, actualErrorStr)
		})
	}
}

func TestDatasource(t *testing.T) {

	testSuite := []struct {
		title            string
		datasourceFiles  []string
		expectedErrorStr string
	}{
		{
			title:            "nominal cases",
			datasourceFiles:  []string{"datasource_direct.json", "datasource_proxy.json", "datasource_proxy_2.json"},
			expectedErrorStr: "",
		},
		{
			title:            "error case with wrongly-formatted URL",
			datasourceFiles:  []string{"datasource_direct_2_invalid.json"},
			expectedErrorStr: "invalid value \"www.datasource.com\" (out of bound",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			var datasourcesRaw [][]byte
			for _, file := range test.datasourceFiles {
				datasourcesRaw = append(datasourcesRaw, testUtils.ReadFile(filepath.Join(testDataFolder, file)))
			}

			projectPath := testUtils.GetRepositoryPath()
			schemasService, schErr := schemas.New(config.Schemas{
				// use the real schemas for these tests
				PanelsPath:      filepath.Join(projectPath, config.DefaultPanelsPath),
				QueriesPath:     filepath.Join(projectPath, config.DefaultQueriesPath),
				DatasourcesPath: filepath.Join(projectPath, config.DefaultDatasourcesPath),
				VariablesPath:   filepath.Join(projectPath, config.DefaultVariablesPath),
			})
			if schErr != nil {
				t.Fatal(schErr)
			}

			var datasources []*modelV1.Datasource
			for _, datasourceRaw := range datasourcesRaw {
				var datasource modelV1.Datasource
				testUtils.JSONUnmarshal(datasourceRaw, &datasource)

				datasources = append(datasources, &datasource)
			}

			for _, datasource := range datasources {
				err := Datasource(datasource, datasources, schemasService)
				if test.expectedErrorStr == "" {
					assert.NoError(t, err)
				} else {
					assert.ErrorContains(t, err, test.expectedErrorStr)
				}
			}
		})
	}
}
