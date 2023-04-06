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

package e2e

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"testing"

	"github.com/gavv/httpexpect/v2"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/shared/dependency"
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
			title:                "grafana dashboard containing simple vars & panels",
			initialDashboardPath: "internal/api/shared/migrate/testdata/simple_grafana_dashboard.json",
			resultDashboardPath:  "internal/api/shared/migrate/testdata/simple_perses_dashboard.json",
		},
		{
			title:                "grafana dashboard containing old-formatted elements (text panels without `options` field & a legacy graph panel)",
			initialDashboardPath: "internal/api/shared/migrate/testdata/old_grafana_panels_grafana_dashboard.json",
			resultDashboardPath:  "internal/api/shared/migrate/testdata/old_grafana_panels_perses_dashboard.json",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			rawGrafanaDashboard := testUtils.ReadFile(filepath.Join(testUtils.GetRepositoryPath(), test.initialDashboardPath))
			rawPersesDashboard := testUtils.ReadFile(filepath.Join(testUtils.GetRepositoryPath(), test.resultDashboardPath))

			var grafanaDashboard json.RawMessage
			testUtils.JSONUnmarshal(rawGrafanaDashboard, &grafanaDashboard)
			var persesDashboard modelV1.Dashboard
			testUtils.JSONUnmarshal(rawPersesDashboard, &persesDashboard)

			e2eframework.WithServer(t, func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
				entity := modelAPI.Migrate{
					GrafanaDashboard: grafanaDashboard,
				}
				expect.POST("/api/migrate").
					WithJSON(entity).
					Expect().
					Status(http.StatusOK).
					JSON().
					Equal(persesDashboard)
				return []modelAPI.Entity{}
			})
		})
	}
}
