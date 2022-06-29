// Copyright 2022 The Perses Authors
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

package schemas

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/perses/perses/internal/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
)

func TestValidateDashboard(t *testing.T) {
	testSuite := []struct {
		title     string
		dashboard *v1.Dashboard
		result    string
	}{
		{
			title: "dashboard containing valid panels",
			dashboard: &v1.Dashboard{
				Kind: v1.KindDashboard,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: v1.DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]json.RawMessage{
						"MyAwesomePanel": []byte(`
							{
								"kind": "AwesomeChart",
								"display": {
									"name": "simple awesome chart",
								},
								"datasource": {
									"kind": "CustomDatasource",
									"key": "MyCustomDatasource"
								},
								"options": {
									"a": "yes",
									"b": {
										"c": [
											{
												"e": "up",
												"f": "the up metric"
											}
										]
									},
									queries: [
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": true
											}
										},
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": false
											}
										}
									]
								}
							}
						`),
						"MyAveragePanel": []byte(`
							{
								"kind": "AverageChart",
								"display": {
									"name": "simple average chart",
								},
								"datasource": {
									"kind": "SQLDatasource",
								},
								"options": {
									"a": "yes",
									"b": {
										"c": false,
										"d": [
											{
												"f": 66
											}
										]
									},
									query: {
										"kind": "SQLGraphQuery",
										"options": {
											"select": "*"
											"from": "TABLE"
											"where": "ID > 0"
										}
									}
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
											Ref: "#/spec/panels/MyAveragePanel",
										},
									},
									{
										X:      0,
										Y:      0,
										Width:  3,
										Height: 4,
										Content: &common.JSONRef{
											Ref: "#/spec/panels/MyAwesomePanel",
										},
									},
								},
							},
						},
					},
				},
			},
			result: "",
		},
		{
			title: "dashboard containing an invalid panel (unknown panel kind)",
			dashboard: &v1.Dashboard{
				Kind: v1.KindDashboard,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: v1.DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": []byte(`
							{
								"kind": "UnknownChart",
								"display": {
									"name": "simple unknown chart",
								},
								"datasource": {
									"kind": "CustomDatasource",
									"key": "CustomGraphQuery"
								},
								"options": {
									"a": "no",
									"b": {
										"c": [
											{
												"e": "up",
												"f": "the up metric"
											}
										]
									},
									queries: [
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": true
											}
										},
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": false
											}
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
											Ref: "#/spec/panels/MyInvalidPanel",
										},
									},
								},
							},
						},
					},
				},
			},
			result: "invalid panel MyInvalidPanel: Unknown kind UnknownChart",
		},
		{
			title: "dashboard containing an invalid panel (unknown datasource kind)",
			dashboard: &v1.Dashboard{
				Kind: v1.KindDashboard,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: v1.DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": []byte(`
							{
								"kind": "AwesomeChart",
								"display": {
									"name": "simple awesome chart",
								},
								"datasource": {
									"kind": "UnknownDatasource",
									"key": "UnknownGraphQuery"
								},
								"options": {
									"a": "no",
									"b": {
										"c": [
											{
												"e": "up",
												"f": "the up metric"
											}
										]
									},
									queries: [
										{
											"kind": "UnknownGraphQuery",
											"options": {
												"custom": false
											}
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
											Ref: "#/spec/panels/MyInvalidPanel",
										},
									},
								},
							},
						},
					},
				},
			},
			result: "invalid panel MyInvalidPanel: Unknown datasource.kind UnknownDatasource",
		},
		{
			title: "dashboard containing an invalid panel (missing mandatory attribute)",
			dashboard: &v1.Dashboard{
				Kind: v1.KindDashboard,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: v1.DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": []byte(`
							{
								"display": {
									"name": "simple awesome chart",
								},
								"datasource": {
									"kind": "CustomDatasource",
									"key": "CustomGraphQuery"
								},
								"options": {
									"a": "no",
									"b": {
										"c": [
											{
												"e": "up",
												"f": "the up metric"
											}
										]
									},
									queries: [
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": true
											}
										},
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": false
											}
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
											Ref: "#/spec/panels/MyInvalidPanel",
										},
									},
								},
							},
						},
					},
				},
			},
			result: "invalid panel MyInvalidPanel: field \"kind\" not found",
		},
		{
			title: "dashboard containing an invalid panel (chart field not allowed)",
			dashboard: &v1.Dashboard{
				Kind: v1.KindDashboard,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: v1.DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": []byte(`
							{
								"kind": "AwesomeChart",
								"display": {
									"aaaaaa": "simple awesome chart",
								},
								"datasource": {
									"kind": "CustomDatasource",
									"key": "CustomGraphQuery"
								},
								"options": {
									"a": "no",
									"b": {
										"c": [
											{
												"e": "up",
												"f": "the up metric"
											}
										]
									},
									queries: [
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": true
											}
										},
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": false
											}
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
											Ref: "#/spec/panels/MyInvalidPanel",
										},
									},
								},
							},
						},
					},
				},
			},
			result: "invalid panel MyInvalidPanel: display: field not allowed: aaaaaa",
		},
		{
			title: "dashboard containing an invalid panel (query field not allowed)",
			dashboard: &v1.Dashboard{
				Kind: v1.KindDashboard,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: v1.DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": []byte(`
							{
								"kind": "AwesomeChart",
								"display": {
									"name": "simple awesome chart",
								},
								"datasource": {
									"kind": "CustomDatasource",
									"key": "CustomGraphQuery"
								},
								"options": {
									"a": "no",
									"b": {
										"c": [
											{
												"e": "up",
												"f": "the up metric"
											}
										]
									},
									queries: [
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": true
											},
											"unwanted": true
										},
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
											Ref: "#/spec/panels/MyInvalidPanel",
										},
									},
								},
							},
						},
					},
				},
			},
			result: "invalid panel MyInvalidPanel: options.queries.0: field not allowed: unwanted",
		},
		{
			title: "dashboard containing an invalid panel (query not matching datasource type)",
			dashboard: &v1.Dashboard{
				Kind: v1.KindDashboard,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: "SimpleDashboard",
					},
					Project: "perses",
				},
				Spec: v1.DashboardSpec{
					Datasource: dashboard.Datasource{
						Name: "PrometheusDemo",
						Kind: datasource.PrometheusKind,
					},
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": []byte(`
							{
								"kind": "AwesomeChart",
								"display": {
									"name": "simple awesome chart",
								},
								"datasource": {
									"kind": "CustomDatasource",
									"key": "CustomGraphQuery"
								},
								"options": {
									"a": "no",
									"b": {
										"c": [
											{
												"e": "up",
												"f": "the up metric"
											}
										]
									},
									queries: [
										{
											"kind": "CustomGraphQuery",
											"options": {
												"custom": true
											}
										},
										{
											"kind": "SQLGraphQuery",
											"options": {
												"select": "*"
												"from": "TABLE"
												"where": "ID > 0"
											}
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
											Ref: "#/spec/panels/MyInvalidPanel",
										},
									},
								},
							},
						},
					},
				},
			},
			result: "invalid panel MyInvalidPanel: options.queries.1.kind: conflicting values \"CustomGraphQuery\" and \"SQLGraphQuery\"",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			validator := NewValidator(config.Schemas{
				ChartsPath:  "testdata/charts",
				QueriesPath: "testdata/queries",
			})
			validator.LoadCharts()
			validator.LoadQueries()

			err := validator.Validate(test.dashboard.Spec.Panels)
			errString := ""
			if err != nil {
				errString = err.Error()
			}
			assert.Equal(t, test.result, errString)
		})
	}
}
