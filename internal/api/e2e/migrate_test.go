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
	"os"
	"path/filepath"
	"testing"

	"github.com/gavv/httpexpect/v2"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/shared/dependency"
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
			initialDashboardPath: "internal/api/shared/migrate/testdata/old_format_grafana_dashboard.json",
			resultDashboardPath:  "internal/api/shared/migrate/testdata/old_format_perses_dashboard.json",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			rawGrafanaDashboard, err := os.ReadFile(filepath.Join(e2eframework.GetRepositoryPath(t), test.initialDashboardPath))
			if err != nil {
				t.Fatal(err)
			}
			rawPersesDashboard, err := os.ReadFile(filepath.Join(e2eframework.GetRepositoryPath(t), test.resultDashboardPath))
			if err != nil {
				t.Fatal(err)
			}
			var grafanaDashboard json.RawMessage
			if unmarshalErr := json.Unmarshal(rawGrafanaDashboard, &grafanaDashboard); unmarshalErr != nil {
				t.Fatal(unmarshalErr)
			}
			var persesDashboard modelV1.Dashboard
			if unmarshallErr := json.Unmarshal(rawPersesDashboard, &persesDashboard); unmarshallErr != nil {
				t.Fatal(unmarshallErr)
			}
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
