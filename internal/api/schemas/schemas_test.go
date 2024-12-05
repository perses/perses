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

package schemas

import (
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"github.com/stretchr/testify/assert"
)

func loadPlugin(testDataPath string, t *testing.T) common.Plugin {
	data, readErr := os.ReadFile(testDataPath)
	if readErr != nil {
		t.Fatal(readErr)
	}

	plg := common.Plugin{}
	unmarshallErr := json.Unmarshal(data, &plg)
	if unmarshallErr != nil {
		t.Fatal(unmarshallErr)
	}

	return plg
}

func loadQueries(testDataPath string, t *testing.T) []v1.Query {
	data, readErr := os.ReadFile(testDataPath)
	if readErr != nil {
		t.Fatal(readErr)
	}

	var queries []v1.Query
	unmarshallErr := json.Unmarshal(data, &queries)
	if unmarshallErr != nil {
		t.Fatal(unmarshallErr)
	}

	return queries
}

func TestValidatePanels(t *testing.T) {
	// panels plugins samples
	validFirstPanel := loadPlugin("testdata/samples/panels/valid_first_panel.json", t)
	validSecondPanel := loadPlugin("testdata/samples/panels/valid_second_panel.json", t)
	validThirdPanel := loadPlugin("testdata/samples/panels/valid_third_panel.json", t)
	invalidKindPanel := loadPlugin("testdata/samples/panels/invalid_kind_panel.json", t)
	// queries plugins samples
	validCustomQueries := loadQueries("testdata/samples/queries/valid_custom_queries.json", t)
	validSQLQuery := loadQueries("testdata/samples/queries/valid_sql_query.json", t)
	invalidKindQuery := loadQueries("testdata/samples/queries/invalid_kind_query.json", t)
	invalidDatasourceMismatchQuery := loadQueries("testdata/samples/queries/invalid_datasource_mismatch_query.json", t)
	invalidUnwantedFieldQuery := loadQueries("testdata/samples/queries/invalid_unwanted_field_query.json", t)

	metadata := v1.ProjectMetadata{
		Metadata: v1.Metadata{
			Name: "SimpleDashboard",
		},
		ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
			Project: "perses",
		},
	}

	testSuite := []struct {
		title            string
		dashboard        *v1.Dashboard
		expectedErrorStr string
	}{
		{
			title: "dashboard containing valid panels",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  common.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyFirstPanel": {
							Spec: v1.PanelSpec{
								Plugin:  validFirstPanel,
								Queries: validCustomQueries,
							},
						},
						"MySecondPanel": {
							Spec: v1.PanelSpec{
								Plugin:  validSecondPanel,
								Queries: validSQLQuery,
							},
						},
						"MyThirdPanel": {
							Spec: v1.PanelSpec{
								Plugin:  validThirdPanel,
								Queries: validCustomQueries,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "",
		},
		{
			title: "dashboard containing an invalid panel (unknown panel kind)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  common.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyInvalidPanel": {
							Spec: v1.PanelSpec{
								Plugin:  invalidKindPanel,
								Queries: validCustomQueries,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "invalid panel MyInvalidPanel: Unknown kind UnknownChart",
		},
		{
			title: "dashboard containing a panel with an invalid query (unknown query type)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  common.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyInvalidPanel": {
							Spec: v1.PanelSpec{
								Plugin:  validFirstPanel,
								Queries: invalidKindQuery,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "invalid query n°1: Unknown kind UnknownGraphQuery",
		},
		{
			title: "dashboard containing a panel with an invalid query (field not allowed)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  common.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyInvalidPanel": {
							Spec: v1.PanelSpec{
								Plugin:  validSecondPanel,
								Queries: invalidUnwantedFieldQuery,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "invalid query n°1: spec.aaaaaa: field not allowed",
		},
		{
			title: "dashboard containing a panel with an invalid query (datasource type not matching query type)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration:  common.Duration(6 * time.Hour),
					Variables: nil,
					Panels: map[string]*v1.Panel{
						"MyInvalidPanel": {
							Spec: v1.PanelSpec{
								Plugin:  validSecondPanel,
								Queries: invalidDatasourceMismatchQuery,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "invalid query n°1: spec.datasource.kind: conflicting values \"CustomDatasource\" and \"SQLDatasource\"",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			schema, err := New(config.Schemas{
				PanelsPath:  "testdata/schemas/panels",
				QueriesPath: "testdata/schemas/queries",
			})
			if err != nil {
				t.Fatal(err)
			}

			err = schema.ValidatePanels(test.dashboard.Spec.Panels)

			if test.expectedErrorStr == "" {
				assert.NoError(t, err)
			} else {
				assert.ErrorContains(t, err, test.expectedErrorStr)
			}
		})
	}
}

func TestValidateDashboardVariables(t *testing.T) {
	validFirstVariable := loadPlugin("testdata/samples/variables/valid_first_variable.json", t)
	validSecondVariable := loadPlugin("testdata/samples/variables/valid_second_variable.json", t)
	invalidUnknownVariable := loadPlugin("testdata/samples/variables/invalid_unknown_variable.json", t)

	metadata := v1.ProjectMetadata{
		Metadata: v1.Metadata{
			Name: "SimpleDashboard",
		},
		ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
			Project: "perses",
		},
	}

	testSuite := []struct {
		title            string
		dashboard        *v1.Dashboard
		expectedErrorStr string
	}{
		{
			title: "dashboard containing valid variables",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration: common.Duration(6 * time.Hour),
					Variables: []dashboard.Variable{
						{
							Kind: variable.KindList,
							Spec: &dashboard.ListVariableSpec{
								ListSpec: variable.ListSpec{
									Display: &variable.Display{
										Name:        "My First Variable",
										Description: "A simple variable of type FirstVariable",
										Hidden:      false,
									},
									AllowAllValue: true,
									AllowMultiple: false,
									Plugin:        validFirstVariable,
								},
								Name: "my1rstVar",
							},
						},
						{
							Kind: variable.KindList,
							Spec: &dashboard.ListVariableSpec{
								ListSpec: variable.ListSpec{
									Display: &variable.Display{
										Name:        "My Second Variable",
										Description: "A simple variable of type SecondVariable",
										Hidden:      false,
									},
									AllowAllValue: true,
									AllowMultiple: false,
									Plugin:        validSecondVariable,
								},
								Name: "my2ndVar",
							},
						},
					},
					Panels:  map[string]*v1.Panel{},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "",
		},
		{
			title: "dashboard containing a variable of an unknown schema type",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Duration: common.Duration(6 * time.Hour),
					Variables: []dashboard.Variable{
						{
							Kind: "ListVariable",
							Spec: &dashboard.ListVariableSpec{
								ListSpec: variable.ListSpec{
									Display: &variable.Display{
										Name:        "My Unknown Variable",
										Description: "A simple variable of type UnknownVariable",
										Hidden:      false,
									},
									AllowAllValue: false,
									AllowMultiple: true,
									Plugin:        invalidUnknownVariable,
								},
								Name: "myUnknownVar",
							},
						},
					},
					Panels:  map[string]*v1.Panel{},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "invalid variable myUnknownVar: Unknown kind UnknownVariable",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			schema, err := New(config.Schemas{
				VariablesPath: "testdata/schemas/variables",
			})
			if err != nil {
				t.Fatal(err)
			}
			err = schema.ValidateDashboardVariables(test.dashboard.Spec.Variables)

			if test.expectedErrorStr == "" {
				assert.NoError(t, err)
			} else {
				assert.ErrorContains(t, err, test.expectedErrorStr)
			}
		})
	}
}
