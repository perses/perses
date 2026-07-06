// Copyright The Perses Authors
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
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/plugin"
)

func buildDashboardWithQuery(query string) *v1.Dashboard {
	return &v1.Dashboard{
		Kind:     v1.KindDashboard,
		Metadata: *v1.NewProjectMetadata("perses", "promql-test"),
		Spec: dashboard.Spec{
			Duration: "5m",
			Panels: map[string]*dashboard.Panel{
				"testPanel": {
					Spec: dashboard.PanelSpec{
						Plugin: plugin.Plugin{
							Kind: "TimeSeriesChart",
							Spec: map[string]any{},
						},
						Queries: []dashboard.Query{
							{
								Spec: dashboard.QuerySpec{
									Plugin: plugin.Plugin{
										Kind: "PrometheusTimeSeriesQuery",
										Spec: map[string]any{
											"query": query,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
}

func TestValidateDashboardWithValidPromQL(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []api.Entity {
		entity := buildDashboardWithQuery("rate(http_requests_total[5m])")

		expect.POST("/api/validate/dashboards").
			WithJSON(entity).
			Expect().
			Status(http.StatusOK)

		return nil
	})
}

func TestValidateDashboardWithInvalidPromQL(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []api.Entity {
		entity := buildDashboardWithQuery("rate(up[)")

		resp := expect.POST("/api/validate/dashboards").
			WithJSON(entity).
			Expect().
			Status(http.StatusBadRequest)

		resp.Body().Contains("invalid PromQL")

		return nil
	})
}

func TestValidateDashboardWithVariableRefPromQL(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []api.Entity {
		entity := buildDashboardWithQuery(`rate(http_requests_total{namespace="$namespace"}[5m])`)

		expect.POST("/api/validate/dashboards").
			WithJSON(entity).
			Expect().
			Status(http.StatusOK)

		return nil
	})
}
