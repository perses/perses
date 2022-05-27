// Copyright 2021 The Perses Authors
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

package v1

import (
	"encoding/json"
	"regexp"
	"testing"
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
)

func TestMarshalDashboard(t *testing.T) {
	testSuite := []struct {
		title     string
		dashboard *Dashboard
		result    string
	}{
		{
			title: "simple dashboard",
			dashboard: &Dashboard{
				Kind: KindDashboard,
				Metadata: ProjectMetadata{
					Metadata: Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]json.RawMessage{"MyPanel": []byte(`
						{
							"displayed_name": "simple line chart",
							"kind": "LineChart",
							"chart": {
								"show_legend": false,
								"lines": [
									{
										"expr": "up"
									}
								]
							}
						}
					`),
					},
					Layouts: []dashboard.Layout{
						{
							Kind: dashboard.KindGridLayout,
							Spec: &dashboard.GridLayoutSpec{
								Items: []dashboard.GridItem{
									{
										X:      0,
										Y:      0,
										Width:  3,
										Height: 4,
										Content: &common.JSONRef{
											Ref:  "#/panels/MyPanel",
											Path: []string{"panels", "MyPanel"},
										},
									},
								},
							},
						},
					},
				},
			},
			result: `{
  "kind": "Dashboard",
  "metadata": {
    "name": "SimpleDashboard",
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z",
    "project": "perses"
  },
  "spec": {
    "datasource": {
      "name": "PrometheusDemo",
      "kind": "Prometheus",
      "global": false
    },
    "duration": "6h",
    "panels": {
      "MyPanel": {
        "displayed_name": "simple line chart",
        "kind": "LineChart",
        "chart": {
          "show_legend": false,
          "lines": [
            {
              "expr": "up"
            }
          ]
        }
      }
    },
    "layouts": [
      {
        "kind": "Grid",
        "spec": {
          "items": [
            {
              "x": 0,
              "y": 0,
              "width": 3,
              "height": 4,
              "content": {
                "$ref": "#/panels/MyPanel"
              }
            }
          ]
        }
      }
    ]
  }
}`,
		},
		{
			title: "simple dashboard with variable",
			dashboard: &Dashboard{
				Kind: KindDashboard,
				Metadata: ProjectMetadata{
					Metadata: Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration: model.Duration(6 * time.Hour),
					Variables: map[string]*dashboard.Variable{
						"labelName": {
							Kind: dashboard.KindLabelNamesQueryVariable,
							Hide: true,
							Parameter: &dashboard.LabelNamesQueryVariableParameter{
								Matchers: []string{
									"up",
								},
								CapturingRegexp: (*dashboard.CapturingRegexp)(regexp.MustCompile(`(.*)`)),
							},
						},
						"labelValue": {
							Kind: dashboard.KindLabelValuesQueryVariable,
							Hide: true,
							Parameter: &dashboard.LabelValuesQueryVariableParameter{
								LabelName: "$labelName",
								Matchers: []string{
									"up",
								},
								CapturingRegexp: (*dashboard.CapturingRegexp)(regexp.MustCompile(`(.*)`)),
							},
						},
					},
					Panels: map[string]json.RawMessage{"MyPanel": []byte(`
						{
							"displayed_name": "simple line chart",
							"kind": "LineChart",
							"chart": {
								"show_legend": false,
								"lines": [
									{
										"expr": "up"
									}
								]
							}
						}
					`),
					},
					Layouts: []dashboard.Layout{
						{
							Kind: dashboard.KindGridLayout,
							Spec: &dashboard.GridLayoutSpec{
								Items: []dashboard.GridItem{
									{
										X:      0,
										Y:      0,
										Width:  3,
										Height: 4,
										Content: &common.JSONRef{
											Ref:  "#/panels/MyPanel",
											Path: []string{"panels", "MyPanel"},
										},
									},
								},
							},
						},
					},
				},
			},
			result: `{
  "kind": "Dashboard",
  "metadata": {
    "name": "SimpleDashboard",
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z",
    "project": "perses"
  },
  "spec": {
    "datasource": {
      "name": "PrometheusDemo",
      "kind": "Prometheus",
      "global": false
    },
    "duration": "6h",
    "variables": {
      "labelName": {
        "kind": "LabelNamesQuery",
        "hide": true,
        "parameter": {
          "matchers": [
            "up"
          ],
          "capturing_regexp": "(.*)"
        }
      },
      "labelValue": {
        "kind": "LabelValuesQuery",
        "hide": true,
        "parameter": {
          "label_name": "$labelName",
          "matchers": [
            "up"
          ],
          "capturing_regexp": "(.*)"
        }
      }
    },
    "panels": {
      "MyPanel": {
        "displayed_name": "simple line chart",
        "kind": "LineChart",
        "chart": {
          "show_legend": false,
          "lines": [
            {
              "expr": "up"
            }
          ]
        }
      }
    },
    "layouts": [
      {
        "kind": "Grid",
        "spec": {
          "items": [
            {
              "x": 0,
              "y": 0,
              "width": 3,
              "height": 4,
              "content": {
                "$ref": "#/panels/MyPanel"
              }
            }
          ]
        }
      }
    ]
  }
}`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			data, err := json.MarshalIndent(test.dashboard, "", "  ")
			assert.NoError(t, err)
			assert.Equal(t, test.result, string(data))
		})
	}
}
