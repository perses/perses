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
	"testing"
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
)

type TimeSeriesSpec struct {
	ShowLegend bool     `json:"show_legend" yaml:"show_legend"`
	Lines      []string `json:"lines" yaml:"lines"`
}

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
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*Panel{
						"MyPanel": {
							Kind: "Panel",
							Spec: PanelSpec{
								Display: &common.Display{
									Name: "simple line chart",
								},
								Plugin: common.Plugin{
									Kind: "TimeSeriesChart",
									Spec: TimeSeriesSpec{
										ShowLegend: false,
										Lines:      []string{"up"},
									},
								},
							},
						},
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
											Ref:  "#/spec/panels/MyPanel",
											Path: []string{"spec", "panels", "MyPanel"},
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
    "duration": "6h",
    "panels": {
      "MyPanel": {
        "kind": "Panel",
        "spec": {
          "display": {
            "name": "simple line chart"
          },
          "plugin": {
            "kind": "TimeSeriesChart",
            "spec": {
              "show_legend": false,
              "lines": [
                "up"
              ]
            }
          }
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
                "$ref": "#/spec/panels/MyPanel"
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
					Duration: model.Duration(6 * time.Hour),
					Variables: []dashboard.Variable{
						{
							Kind: dashboard.ListVariable,
							Spec: &dashboard.ListVariableSpec{
								Name: "labelName",
								Plugin: common.Plugin{
									Kind: "PrometheusLabelNamesVariable",
									Spec: map[string]interface{}{
										"matchers": []string{
											"up",
										},
									},
								},
							},
						},
						{
							Kind: dashboard.ListVariable,
							Spec: &dashboard.ListVariableSpec{
								Name: "labelValue",
								Plugin: common.Plugin{
									Kind: "PrometheusLabelValuesVariable",
									Spec: map[string]interface{}{
										"label_name": "$labelName",
										"matchers": []string{
											"up",
										},
									},
								},
							},
						},
					},
					Panels: map[string]*Panel{
						"MyPanel": {
							Kind: "Panel",
							Spec: PanelSpec{
								Display: &common.Display{
									Name: "simple line chart",
								},
								Plugin: common.Plugin{
									Kind: "TimeSeriesChart",
									Spec: TimeSeriesSpec{
										ShowLegend: false,
										Lines:      []string{"up"},
									},
								},
							},
						},
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
											Ref:  "#/spec/panels/MyPanel",
											Path: []string{"spec", "panels", "MyPanel"},
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
    "duration": "6h",
    "variables": [
      {
        "kind": "ListVariable",
        "spec": {
          "name": "labelName",
          "plugin": {
            "kind": "PrometheusLabelNamesVariable",
            "spec": {
              "matchers": [
                "up"
              ]
            }
          }
        }
      },
      {
        "kind": "ListVariable",
        "spec": {
          "name": "labelValue",
          "plugin": {
            "kind": "PrometheusLabelValuesVariable",
            "spec": {
              "label_name": "$labelName",
              "matchers": [
                "up"
              ]
            }
          }
        }
      }
    ],
    "panels": {
      "MyPanel": {
        "kind": "Panel",
        "spec": {
          "display": {
            "name": "simple line chart"
          },
          "plugin": {
            "kind": "TimeSeriesChart",
            "spec": {
              "show_legend": false,
              "lines": [
                "up"
              ]
            }
          }
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
                "$ref": "#/spec/panels/MyPanel"
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

func TestUnmarshallDashboard(t *testing.T) {
	jsonDashboard := `{
  "kind": "Dashboard",
  "metadata": {
    "name": "SimpleDashboard",
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z",
    "project": "perses"
  },
  "spec": {
    "duration": "6h",
    "variables": [
      {
        "kind": "ListVariable",
        "spec": {
          "name": "labelName",
          "plugin": {
            "kind": "PrometheusLabelNamesVariable",
            "spec": {
              "matchers": [
                "up"
              ]
            }
          }
        }
      },
      {
        "kind": "ListVariable",
        "spec": {
          "name": "labelValue",
          "plugin": {
            "kind": "PrometheusLabelValuesVariable",
            "spec": {
              "label_name": "$labelName",
              "matchers": [
                "up"
              ]
            }
          }
        }
      }
    ],
    "panels": {
      "MyPanel": {
        "kind": "Panel",
        "spec": {
          "display": {
            "name": "simple line chart"
          },
          "plugin": {
            "kind": "TimeSeriesChart",
            "spec": {
              "show_legend": false,
              "lines": [
                "up"
              ]
            }
          }
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
                "$ref": "#/spec/panels/MyPanel"
              }
            }
          ]
        }
      }
    ]
  }
}`

	panel := &Panel{
		Kind: "Panel",
		Spec: PanelSpec{
			Display: &common.Display{
				Name: "simple line chart",
			},
			Plugin: common.Plugin{
				Kind: "TimeSeriesChart",
				Spec: map[string]interface{}{
					"lines": []interface{}{
						"up",
					},
					"show_legend": false,
				},
			},
		},
	}
	expected := &Dashboard{
		Kind: KindDashboard,
		Metadata: ProjectMetadata{
			Metadata: Metadata{
				Name: "SimpleDashboard",
			},
			Project: "perses",
		},
		Spec: DashboardSpec{
			Duration: model.Duration(6 * time.Hour),
			Variables: []dashboard.Variable{
				{
					Kind: dashboard.ListVariable,
					Spec: &dashboard.ListVariableSpec{
						Name: "labelName",
						Plugin: common.Plugin{
							Kind: "PrometheusLabelNamesVariable",
							Spec: map[string]interface{}{
								"matchers": []interface{}{
									"up",
								},
							},
						},
					},
				},
				{
					Kind: dashboard.ListVariable,
					Spec: &dashboard.ListVariableSpec{
						Name: "labelValue",
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[string]interface{}{
								"label_name": "$labelName",
								"matchers": []interface{}{
									"up",
								},
							},
						},
					},
				},
			},
			Panels: map[string]*Panel{"MyPanel": panel},
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
									Ref:    "#/spec/panels/MyPanel",
									Path:   []string{"spec", "panels", "MyPanel"},
									Object: panel,
								},
							},
						},
					},
				},
			},
		},
	}
	result := &Dashboard{}
	err := json.Unmarshal([]byte(jsonDashboard), result)
	assert.NoError(t, err)
	assert.Equal(t, expected, result)
}
