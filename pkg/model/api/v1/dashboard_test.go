// Copyright 2021 Amadeus s.a.s
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
					Datasource: "PrometheusDemo",
					Duration:   model.Duration(6 * time.Hour),
					Variables:  nil,
					Sections: map[string]*DashboardSection{
						"MySection": {
							Order: 0,
							Open:  false,
							Panels: map[string]*Panel{
								"MyPanel": {
									Order: 0,
									Kind:  KindLineChart,
									Chart: &LineChart{
										ShowLegend: false,
										Lines: []Line{
											{
												Expr: "up",
											},
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
    "datasource": "PrometheusDemo",
    "duration": "6h",
    "sections": {
      "MySection": {
        "order": 0,
        "open": false,
        "panels": {
          "MyPanel": {
            "order": 0,
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
        }
      }
    }
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
					Datasource: "PrometheusDemo",
					Duration:   model.Duration(6 * time.Hour),
					Variables: map[string]*DashboardVariable{
						"labelName": {
							Kind: KindLabelNamesQueryVariable,
							Hide: false,
							Parameter: &LabelNamesQueryVariableParameter{
								Matchers: []string{
									"up",
								},
								CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`(.*)`)),
							},
						},
						"labelValue": {
							Kind: KindLabelValuesQueryVariable,
							Hide: false,
							Parameter: &LabelValuesQueryVariableParameter{
								LabelName: "$labelName",
								Matchers: []string{
									"up",
								},
								CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`(.*)`)),
							},
						},
					},
					Sections: map[string]*DashboardSection{
						"MySection": {
							Order: 0,
							Open:  false,
							Panels: map[string]*Panel{
								"MyPanel": {
									Order: 0,
									Kind:  KindLineChart,
									Chart: &LineChart{
										ShowLegend: false,
										Lines: []Line{
											{
												Expr: "up",
											},
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
    "datasource": "PrometheusDemo",
    "duration": "6h",
    "variables": {
      "labelName": {
        "kind": "LabelNamesQuery",
        "hide": false,
        "parameter": {
          "matchers": [
            "up"
          ],
          "capturing_regexp": "(.*)"
        }
      },
      "labelValue": {
        "kind": "LabelValuesQuery",
        "hide": false,
        "parameter": {
          "label_name": "$labelName",
          "matchers": [
            "up"
          ],
          "capturing_regexp": "(.*)"
        }
      }
    },
    "sections": {
      "MySection": {
        "order": 0,
        "open": false,
        "panels": {
          "MyPanel": {
            "order": 0,
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
        }
      }
    }
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
