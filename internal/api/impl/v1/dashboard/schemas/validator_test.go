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
						"MyLinePanel": []byte(`
							{
								"a": "simple average chart",
								"kind": "AverageChart",
								"c": {
									"d": false,
									"e": [
										{
											"f": 66
										}
									]
								}
							}
						`),
						"MyBarPanel": []byte(`
							{
								"a": "simple awesome chart",
								"kind": "AwesomeChart",
								"c": {
									"d": [
										{
											"e": "up",
											"f": "the up metric"
										}
									]
								}
							}
						`),
					},
					Entrypoint: &common.JSONRef{
						Ref: "#/spec/layouts/main",
					},
					Layouts: map[string]*dashboard.Layout{
						"main": {
							Kind: dashboard.KindExpandLayout,
							Parameter: dashboard.ExpandLayoutParameter{
								Open: false,
								Children: []*common.JSONRef{
									{
										Ref: "#/spec/panels/MyAveragePanel",
									},
									{
										Ref: "#/spec/panels/MyAwesomePanel",
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
			title: "dashboard containing an invalid panel",
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
						"MyAveragePanel": []byte(`
							{
								"a": "simple average chart",
								"kind": "AverageChart",
								"c": {
									"d": false,
									"e": [
										{
											"f": 66
										}
									]
								}
							}
						`),
						"MyAwesomePanel": []byte(`
							{
								"aaaaaa": "simple awesome chart",
								"kind": "AwesomeChart",
								"c": {
									"d": [
										{
											"e": "up",
											"f": "the up metric"
										}
									]
								}
							}
						`),
					},
					Entrypoint: &common.JSONRef{
						Ref: "#/spec/layouts/main",
					},
					Layouts: map[string]*dashboard.Layout{
						"main": {
							Kind: dashboard.KindExpandLayout,
							Parameter: dashboard.ExpandLayoutParameter{
								Open: false,
								Children: []*common.JSONRef{
									{
										Ref: "#/spec/panels/MyAveragePanel",
									},
									{
										Ref: "#/spec/panels/MyAwesomePanel",
									},
								},
							},
						},
					},
				},
			},
			result: "invalid panel MyAwesomePanel: AwesomeChart schema conditions not met: field not allowed: aaaaaa",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			validator := NewValidator(config.Schemas{
				Path: "testdata",
			})
			validator.LoadSchemas()

			err := validator.Validate(test.dashboard.Spec.Panels)
			errString := ""
			if err != nil {
				errString = err.Error()
			}
			assert.Equal(t, test.result, errString)
		})
	}
}
