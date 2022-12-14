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
	"os"
	"testing"
	"time"

	"github.com/perses/perses/internal/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
)

func loadPlugin(testDataPath string) common.Plugin {
	data, _ := os.ReadFile(testDataPath)
	plg := common.Plugin{}
	_ = json.Unmarshal(data, &plg)
	return plg
}

func TestValidatePanels(t *testing.T) {
	validFirstPanel := loadPlugin("testdata/samples/panels/valid_first_panel.json")
	validSecondPanel := loadPlugin("testdata/samples/panels/valid_second_panel.json")
	validThirdPanel := loadPlugin("testdata/samples/panels/valid_third_panel.json")
	invalidKind := loadPlugin("testdata/samples/panels/invalid_kind.json")
	invalidDatasourceKind := loadPlugin("testdata/samples/panels/invalid_datasource_kind.json")
	invalidUnwantedQueryField := loadPlugin("testdata/samples/panels/invalid_unwanted_query_field.json")
	invalidQueryDatasourceMismatch := loadPlugin("testdata/samples/panels/invalid_query_datasource_mismatch.json")

	metadata := v1.ProjectMetadata{
		Metadata: v1.Metadata{
			Name: "SimpleDashboard",
		},
		Project: "perses",
	}

	testSuite := []struct {
		title     string
		dashboard *v1.Dashboard
		result    string
	}{
		{
			title: "dashboard containing valid panels",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyFirstPanel": {
							Spec: v1.PanelSpec{
								Plugin: validFirstPanel,
							},
						},
						"MySecondPanel": {
							Spec: v1.PanelSpec{
								Plugin: validSecondPanel,
							},
						},
						"MyThirdPanel": {
							Spec: v1.PanelSpec{
								Plugin: validThirdPanel,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "",
		},
		{
			title: "dashboard containing an invalid panel (unknown panel kind)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyInvalidPanel": {
							Spec: v1.PanelSpec{
								Plugin: invalidKind,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: Unknown kind UnknownChart",
		},
		{
			title: "dashboard containing an invalid panel (unknown datasource kind)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyInvalidPanel": {
							Spec: v1.PanelSpec{
								Plugin: invalidDatasourceKind,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: spec.queries.0: 2 errors in empty disjunction: (and 2 more errors)",
			// TODO : should be: result: "invalid panel MyInvalidPanel: Unknown datasource.kind UnknownDatasource",
		},
		{
			title: "dashboard containing an invalid panel (query field not allowed)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyInvalidPanel": {
							Spec: v1.PanelSpec{
								Plugin: invalidUnwantedQueryField,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: spec.queries.0: 2 errors in empty disjunction: (and 2 more errors)",
			// TODO : should be: result: "invalid panel MyInvalidPanel: options.queries.0: field not allowed: unwanted",
		},
		{
			title: "dashboard containing an invalid panel (query not matching datasource type)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  model.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyInvalidPanel": {
							Spec: v1.PanelSpec{
								Plugin: invalidQueryDatasourceMismatch,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: spec.queries.0: 2 errors in empty disjunction: (and 2 more errors)",
			// TODO : should be: result: "invalid panel MyInvalidPanel: options.queries.1.kind: conflicting values \"CustomGraphQuery\" and \"SQLGraphQuery\"",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			schema := New(config.Schemas{
				PanelsPath:  "testdata/panels",
				QueriesPath: "testdata/queries",
			})
			for _, l := range schema.GetLoaders() {
				assert.NoError(t, l.Load())
			}

			err := schema.ValidatePanels(test.dashboard.Spec.Panels)
			errString := ""
			if err != nil {
				errString = err.Error()
			}
			assert.Equal(t, test.result, errString)
		})
	}
}

func TestValidateVariables(t *testing.T) {
	validFirstVariable := loadPlugin("testdata/samples/variables/valid_first_variable.json")
	validSecondVariable := loadPlugin("testdata/samples/variables/valid_second_variable.json")
	invalidUnknownVariable := loadPlugin("testdata/samples/variables/invalid_unknown_variable.json")

	metadata := v1.ProjectMetadata{
		Metadata: v1.Metadata{
			Name: "SimpleDashboard",
		},
		Project: "perses",
	}

	testSuite := []struct {
		title     string
		dashboard *v1.Dashboard
		result    string
	}{
		{
			title: "dashboard containing valid variables",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration: model.Duration(6 * time.Hour),
					Variables: []dashboard.Variable{
						{
							Kind: "ListVariable",
							Spec: &dashboard.ListVariableSpec{
								CommonVariableSpec: dashboard.CommonVariableSpec{
									Name: "my1rstVar",
									Display: &dashboard.VariableDisplay{
										Name:        "My First Variable",
										Description: "A simple variable of type FirstVariable",
										Hidden:      false,
									},
								},
								AllowAllValue: true,
								AllowMultiple: false,
								Plugin:        validFirstVariable,
							},
						},
						{
							Kind: "ListVariable",
							Spec: &dashboard.ListVariableSpec{
								CommonVariableSpec: dashboard.CommonVariableSpec{
									Name: "my2ndVar",
									Display: &dashboard.VariableDisplay{
										Name:        "My Second Variable",
										Description: "A simple variable of type SecondVariable",
										Hidden:      false,
									},
								},
								AllowAllValue: true,
								AllowMultiple: false,
								Plugin:        validSecondVariable,
							},
						},
					},
					Panels:  map[string]*v1.Panel{},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "",
		},
		{
			title: "dashboard containing a variable of an unknown schema type",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration: model.Duration(6 * time.Hour),
					Variables: []dashboard.Variable{
						{
							Kind: "ListVariable",
							Spec: &dashboard.ListVariableSpec{
								CommonVariableSpec: dashboard.CommonVariableSpec{
									Name: "myUnknownVar",
									Display: &dashboard.VariableDisplay{
										Name:        "My Unknown Variable",
										Description: "A simple variable of type UnknownVariable",
										Hidden:      false,
									},
								},
								AllowAllValue: false,
								AllowMultiple: true,
								Plugin:        invalidUnknownVariable,
							},
						},
					},
					Panels:  map[string]*v1.Panel{},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid variable myUnknownVar: Unknown kind UnknownVariable",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			schema := New(config.Schemas{
				VariablesPath: "testdata/variables",
			})
			for _, l := range schema.GetLoaders() {
				assert.NoError(t, l.Load())
			}

			err := schema.ValidateVariables(test.dashboard.Spec.Variables)
			errString := ""
			if err != nil {
				errString = err.Error()
			}
			assert.Equal(t, test.result, errString)
		})
	}
}
