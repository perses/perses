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
)

func TestValidateDashboardWithInvalidPromQL(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []api.Entity {
		dashboard := map[string]any{
			"kind": "Dashboard",
			"metadata": map[string]any{
				"name":    "test-invalid-promql",
				"project": "perses",
			},
			"spec": map[string]any{
				"display":  map[string]any{"name": "Test Invalid PromQL"},
				"duration": "5m",
				"panels": map[string]any{
					"broken": map[string]any{
						"kind": "Panel",
						"spec": map[string]any{
							"display": map[string]any{"name": "Broken Panel"},
							"plugin": map[string]any{
								"kind": "TimeSeriesChart",
								"spec": map[string]any{},
							},
							"queries": []map[string]any{
								{
									"kind": "TimeSeriesQuery",
									"spec": map[string]any{
										"plugin": map[string]any{
											"kind": "PrometheusTimeSeriesQuery",
											"spec": map[string]any{
												"query": "rate(up[)",
											},
										},
									},
								},
							},
						},
					},
				},
				"layouts": []any{},
			},
		}

		response := expect.POST("/api/validate/dashboards").
			WithJSON(dashboard).
			Expect().
			Status(http.StatusBadRequest)

		response.Body().Contains("invalid PromQL")
		return nil
	})
}

func TestValidateDashboardWithValidPromQL(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []api.Entity {
		dashboard := map[string]any{
			"kind": "Dashboard",
			"metadata": map[string]any{
				"name":    "test-valid-promql",
				"project": "perses",
			},
			"spec": map[string]any{
				"display":  map[string]any{"name": "Test Valid PromQL"},
				"duration": "5m",
				"panels": map[string]any{
					"cpu": map[string]any{
						"kind": "Panel",
						"spec": map[string]any{
							"display": map[string]any{"name": "CPU Panel"},
							"plugin": map[string]any{
								"kind": "TimeSeriesChart",
								"spec": map[string]any{},
							},
							"queries": []map[string]any{
								{
									"kind": "TimeSeriesQuery",
									"spec": map[string]any{
										"plugin": map[string]any{
											"kind": "PrometheusTimeSeriesQuery",
											"spec": map[string]any{
												"query": "rate(http_requests_total[5m])",
											},
										},
									},
								},
							},
						},
					},
				},
				"layouts": []any{},
			},
		}

		expect.POST("/api/validate/dashboards").
			WithJSON(dashboard).
			Expect().
			Status(http.StatusOK)

		return nil
	})
}

func TestValidateDashboardWithVariableRefInPromQL(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []api.Entity {
		dashboard := map[string]any{
			"kind": "Dashboard",
			"metadata": map[string]any{
				"name":    "test-variable-promql",
				"project": "perses",
			},
			"spec": map[string]any{
				"display":  map[string]any{"name": "Test Variable PromQL"},
				"duration": "5m",
				"panels": map[string]any{
					"p1": map[string]any{
						"kind": "Panel",
						"spec": map[string]any{
							"display": map[string]any{"name": "Panel"},
							"plugin": map[string]any{
								"kind": "TimeSeriesChart",
								"spec": map[string]any{},
							},
							"queries": []map[string]any{
								{
									"kind": "TimeSeriesQuery",
									"spec": map[string]any{
										"plugin": map[string]any{
											"kind": "PrometheusTimeSeriesQuery",
											"spec": map[string]any{
												"query": `rate(http_requests_total{namespace="$namespace"}[5m])`,
											},
										},
									},
								},
							},
						},
					},
				},
				"layouts": []any{},
			},
		}

		expect.POST("/api/validate/dashboards").
			WithJSON(dashboard).
			Expect().
			Status(http.StatusOK)

		return nil
	})
}
