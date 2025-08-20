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

package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	testUtils "github.com/perses/perses/internal/test"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func TestMigrateEndpoint(t *testing.T) {
	testSuite := []struct {
		title                string
		initialDashboardPath string
		resultDashboardPath  string
	}{
		{
			// here we reuse some test data from the plugin package but since real plugins are used here,
			// we have to use another JSON file for the expected result
			title:                "basic grafana dashboard containing some vars & panels",
			initialDashboardPath: filepath.Join(testUtils.GetRepositoryPath(), "internal", "api", "plugin", "migrate", "testdata", "dashboards", "basic_grafana_dashboard.json"),
			resultDashboardPath:  filepath.Join("testdata", "basic_perses_dashboard.json"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			var grafanaDashboard json.RawMessage
			testUtils.JSONUnmarshalFromFile(test.initialDashboardPath, &grafanaDashboard)
			var persesDashboard modelV1.Dashboard
			testUtils.JSONUnmarshalFromFile(test.resultDashboardPath, &persesDashboard)

			e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
				entity := modelAPI.Migrate{
					GrafanaDashboard: grafanaDashboard,
				}
				expect.POST("/api/migrate").
					WithJSON(entity).
					Expect().
					Status(http.StatusOK).
					JSON().
					IsEqual(persesDashboard)
				return []modelAPI.Entity{}
			})
		})
	}
}
