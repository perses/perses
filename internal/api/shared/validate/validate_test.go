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

//go:build integration

package validate

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/perses/perses/internal/api/config"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/shared/schemas"
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
			dashboardFile:    "variable_with_regex_dashboard.json",
			expectedErrorStr: "",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			persesDashboardRaw, readErr := os.ReadFile(filepath.Join(testDataFolder, test.dashboardFile))
			if readErr != nil {
				t.Fatal(readErr)
			}
			projectPath := e2eframework.GetRepositoryPath(t)
			schemasService, schErr := schemas.New(config.Schemas{
				// use the real schemas for these tests
				PanelsPath:    filepath.Join(projectPath, config.DefaultPanelsPath),
				QueriesPath:   filepath.Join(projectPath, config.DefaultQueriesPath),
				VariablesPath: filepath.Join(projectPath, config.DefaultVariablesPath),
			})
			if schErr != nil {
				t.Fatal(schErr)
			}

			var persesDashboard modelV1.Dashboard
			unmarshallErr := json.Unmarshal(persesDashboardRaw, &persesDashboard)
			if unmarshallErr != nil {
				t.Fatal(unmarshallErr)
			}

			err := Dashboard(&persesDashboard, schemasService)

			actualErrorStr := ""
			if err != nil {
				actualErrorStr = err.Error()
			}
			assert.Equal(t, test.expectedErrorStr, actualErrorStr)
		})
	}
}
