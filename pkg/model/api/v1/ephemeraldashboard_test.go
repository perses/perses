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
	"fmt"
	"testing"
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"github.com/stretchr/testify/assert"
)

func TestMarshalEphemeralDashboard(t *testing.T) {
	testSuite := []struct {
		title              string
		ephemeralDashboard *EphemeralDashboard
		result             string
	}{
		{
			title: "simple ephemeral dashboard",
			ephemeralDashboard: &EphemeralDashboard{
				Kind: KindEphemeralDashboard,
				Metadata: ProjectMetadata{
					Metadata: Metadata{
						Name: "SimpleDashboard",
					},
					ProjectMetadataWrapper: ProjectMetadataWrapper{
						Project: "perses",
					},
				},
				Spec: EphemeralDashboardSpec{
					EphemeralDashboardSpecBase{
						TTL: common.Duration(24 * time.Hour),
					},
					DashboardSpec{
						Variables: nil,
						Panels: map[string]*Panel{
							"MyPanel": {
								Kind: "Panel",
								Spec: PanelSpec{
									Display: PanelDisplay{
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
						Duration:        common.Duration(6 * time.Hour),
						RefreshInterval: common.Duration(20 * time.Second),
					},
				},
			},
			result: `{
  "kind": "EphemeralDashboard",
  "metadata": {
    "name": "SimpleDashboard",
    "createdAt": "0001-01-01T00:00:00Z",
    "updatedAt": "0001-01-01T00:00:00Z",
    "version": 0,
    "project": "perses"
  },
  "spec": {
    "ttl": "1d",
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
              "showLegend": false,
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
    ],
    "duration": "6h",
    "refreshInterval": "20s"
  }
}`,
		},
		{
			title: "simple dashboard with variable",
			ephemeralDashboard: &EphemeralDashboard{
				Kind: KindEphemeralDashboard,
				Metadata: ProjectMetadata{
					Metadata: Metadata{
						Name: "SimpleDashboard",
					},
					ProjectMetadataWrapper: ProjectMetadataWrapper{
						Project: "perses",
					},
				},
				Spec: EphemeralDashboardSpec{
					EphemeralDashboardSpecBase{
						TTL: common.Duration(24 * time.Hour),
					},
					DashboardSpec{
						Variables: []dashboard.Variable{
							{
								Kind: variable.KindList,
								Spec: &dashboard.ListVariableSpec{
									ListSpec: variable.ListSpec{
										Plugin: common.Plugin{
											Kind: "PrometheusLabelNamesVariable",
											Spec: map[string]any{
												"matchers": []string{
													"up",
												},
											},
										},
									},
									Name: "labelName",
								},
							},
							{
								Kind: variable.KindList,
								Spec: &dashboard.ListVariableSpec{
									ListSpec: variable.ListSpec{
										Plugin: common.Plugin{
											Kind: "PrometheusLabelValuesVariable",
											Spec: map[string]any{
												"labelName": "$labelName",
												"matchers": []string{
													"up",
												},
											},
										},
									},
									Name: "labelValue",
								},
							},
						},
						Panels: map[string]*Panel{
							"MyPanel": {
								Kind: "Panel",
								Spec: PanelSpec{
									Display: PanelDisplay{
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
						Duration:        common.Duration(6 * time.Hour),
						RefreshInterval: common.Duration(15 * time.Second),
					},
				},
			},
			result: `{
  "kind": "EphemeralDashboard",
  "metadata": {
    "name": "SimpleDashboard",
    "createdAt": "0001-01-01T00:00:00Z",
    "updatedAt": "0001-01-01T00:00:00Z",
    "version": 0,
    "project": "perses"
  },
  "spec": {
    "ttl": "1d",
    "variables": [
      {
        "kind": "ListVariable",
        "spec": {
          "allowAllValue": false,
          "allowMultiple": false,
          "plugin": {
            "kind": "PrometheusLabelNamesVariable",
            "spec": {
              "matchers": [
                "up"
              ]
            }
          },
          "name": "labelName"
        }
      },
      {
        "kind": "ListVariable",
        "spec": {
          "allowAllValue": false,
          "allowMultiple": false,
          "plugin": {
            "kind": "PrometheusLabelValuesVariable",
            "spec": {
              "labelName": "$labelName",
              "matchers": [
                "up"
              ]
            }
          },
          "name": "labelValue"
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
              "showLegend": false,
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
    ],
    "duration": "6h",
    "refreshInterval": "15s"
  }
}`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			data, err := json.MarshalIndent(test.ephemeralDashboard, "", "  ")
			assert.NoError(t, err)
			assert.Equal(t, test.result, string(data))
		})
	}
}

func TestUnmarshallEphemeralDashboard(t *testing.T) {
	jsonEphemeralDashboard := `{
  "kind": "EphemeralDashboard",
  "metadata": {
    "name": "SimpleDashboard",
    "createdAt": "0001-01-01T00:00:00Z",
    "updatedAt": "0001-01-01T00:00:00Z",
    "project": "perses"
  },
  "spec": {
    "ttl": "1d",
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
              "labelName": "$labelName",
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
              "showLegend": false,
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
    ],
    "duration": "6h",
    "refreshInterval": "30s"
  }
}`
	panel := &Panel{
		Kind: "Panel",
		Spec: PanelSpec{
			Display: PanelDisplay{
				Name: "simple line chart",
			},
			Plugin: common.Plugin{
				Kind: "TimeSeriesChart",
				Spec: map[string]any{
					"lines": []any{
						"up",
					},
					"showLegend": false,
				},
			},
		},
	}
	expected := &EphemeralDashboard{
		Kind: KindEphemeralDashboard,
		Metadata: ProjectMetadata{
			Metadata: Metadata{
				Name: "SimpleDashboard",
			},
			ProjectMetadataWrapper: ProjectMetadataWrapper{
				Project: "perses",
			},
		},
		Spec: EphemeralDashboardSpec{
			EphemeralDashboardSpecBase{
				TTL: common.Duration(24 * time.Hour),
			},
			DashboardSpec{
				Variables: []dashboard.Variable{
					{
						Kind: variable.KindList,
						Spec: &dashboard.ListVariableSpec{
							ListSpec: variable.ListSpec{
								Plugin: common.Plugin{
									Kind: "PrometheusLabelNamesVariable",
									Spec: map[string]any{
										"matchers": []any{
											"up",
										},
									},
								},
							},
							Name: "labelName",
						},
					},
					{
						Kind: variable.KindList,
						Spec: &dashboard.ListVariableSpec{
							ListSpec: variable.ListSpec{
								Plugin: common.Plugin{
									Kind: "PrometheusLabelValuesVariable",
									Spec: map[string]any{
										"labelName": "$labelName",
										"matchers": []any{
											"up",
										},
									},
								},
							},
							Name: "labelValue",
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
				Duration:        common.Duration(6 * time.Hour),
				RefreshInterval: common.Duration(30 * time.Second),
			},
		},
	}
	result := &EphemeralDashboard{}
	err := json.Unmarshal([]byte(jsonEphemeralDashboard), result)
	assert.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestUnmarshalEphemeralDashboardError(t *testing.T) {
	testSuite := []struct {
		title string
		jason string
		err   error
	}{
		{
			title: "spec cannot be empty",
			jason: `
{
  "kind": "EphemeralDashboard",
  "metadata": {
    "name": "test",
    "project": "perses"
  }
}
`,
			err: fmt.Errorf("spec cannot be empty"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := EphemeralDashboard{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jason), &result))
		})
	}
}
