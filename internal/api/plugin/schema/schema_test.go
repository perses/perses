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

package schema

import (
	"encoding/json"
	"os"
	"strings"
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/dashboard/variable"
	"github.com/perses/spec/go/module"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
)

func loadPluginFromJSON(testDataPath string, t *testing.T) plugin.Plugin {
	data, readErr := os.ReadFile(testDataPath) //nolint: gosec
	if readErr != nil {
		t.Fatal(readErr)
	}

	plg := plugin.Plugin{}
	unmarshallErr := json.Unmarshal(data, &plg)
	if unmarshallErr != nil {
		t.Fatal(unmarshallErr)
	}

	return plg
}

func loadQueriesFromJSON(testDataPath string, t *testing.T) []dashboard.Query {
	data, readErr := os.ReadFile(testDataPath) //nolint: gosec
	if readErr != nil {
		t.Fatal(readErr)
	}

	var queries []dashboard.Query
	unmarshallErr := json.Unmarshal(data, &queries)
	if unmarshallErr != nil {
		t.Fatal(unmarshallErr)
	}

	return queries
}

func loadPlugin(path string, modules []v1.ModuleSpec, sch Schema, t *testing.T) {
	for _, module := range modules {
		if err := sch.Load(path, v1.PluginModule{Spec: module}); err != nil {
			t.Fatal(err)
		}
	}
}

func loadPanelPlugins(panelsPath string, sch Schema, t *testing.T) {
	modules := []v1.ModuleSpec{
		{
			SchemasPath: "first",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindPanel,
					Spec: module.PluginSpec{
						Name: "FirstChart",
					},
				},
			},
		},
		{
			SchemasPath: "second",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindPanel,
					Spec: module.PluginSpec{
						Name: "SecondChart",
					},
				},
			},
		},
		{
			SchemasPath: "third",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindPanel,
					Spec: module.PluginSpec{
						Name: "ThirdChart",
					},
				},
			},
		},
	}
	loadPlugin(panelsPath, modules, sch, t)
}

func loadQueryPlugins(queryPath string, sch Schema, t *testing.T) {
	modules := []v1.ModuleSpec{
		{
			SchemasPath: "custom",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindTimeSeriesQuery,
					Spec: module.PluginSpec{
						Name: "CustomGraphQuery",
					},
				},
			},
		},
		{
			SchemasPath: "sql",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindTraceQuery,
					Spec: module.PluginSpec{
						Name: "SQLGraphQuery",
					},
				},
			},
		},
	}
	loadPlugin(queryPath, modules, sch, t)
}

func loadVariablePlugins(variablePath string, sch Schema, t *testing.T) {
	modules := []v1.ModuleSpec{
		{
			SchemasPath: "first",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindVariable,
					Spec: module.PluginSpec{
						Name: "FirstVariable",
					},
				},
			},
		},
		{
			SchemasPath: "second",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindVariable,
					Spec: module.PluginSpec{
						Name: "SecondVariable",
					},
				},
			},
		},
	}
	loadPlugin(variablePath, modules, sch, t)
}

func TestValidatePanels(t *testing.T) {
	s := New()
	loadPanelPlugins("testdata/schemas/panels", s, t)
	loadQueryPlugins("testdata/schemas/queries", s, t)
	// panels plugins samples
	validFirstPanel := loadPluginFromJSON("testdata/samples/panels/valid_first_panel.json", t)
	validSecondPanel := loadPluginFromJSON("testdata/samples/panels/valid_second_panel.json", t)
	validThirdPanel := loadPluginFromJSON("testdata/samples/panels/valid_third_panel.json", t)
	invalidKindPanel := loadPluginFromJSON("testdata/samples/panels/invalid_kind_panel.json", t)
	// queries plugins samples
	validCustomQueries := loadQueriesFromJSON("testdata/samples/queries/valid_custom_queries.json", t)
	validSQLQuery := loadQueriesFromJSON("testdata/samples/queries/valid_sql_query.json", t)
	invalidKindQuery := loadQueriesFromJSON("testdata/samples/queries/invalid_kind_query.json", t)
	invalidDatasourceMismatchQuery := loadQueriesFromJSON("testdata/samples/queries/invalid_datasource_mismatch_query.json", t)
	invalidUnwantedFieldQuery := loadQueriesFromJSON("testdata/samples/queries/invalid_unwanted_field_query.json", t)

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
				Spec: dashboard.Spec{
					Duration:  "6h",
					Variables: nil,
					Panels: map[string]*dashboard.Panel{
						"MyFirstPanel": {
							Spec: dashboard.PanelSpec{
								Plugin:  validFirstPanel,
								Queries: validCustomQueries,
							},
						},
						"MySecondPanel": {
							Spec: dashboard.PanelSpec{
								Plugin:  validSecondPanel,
								Queries: validSQLQuery,
							},
						},
						"MyThirdPanel": {
							Spec: dashboard.PanelSpec{
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
				Spec: dashboard.Spec{
					Duration:  "6h",
					Variables: nil,
					Panels: map[string]*dashboard.Panel{
						"MyInvalidPanel": {
							Spec: dashboard.PanelSpec{
								Plugin:  invalidKindPanel,
								Queries: validCustomQueries,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "schema not found for plugin UnknownChart",
		},
		{
			title: "dashboard containing a panel with an invalid query (unknown query type)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: dashboard.Spec{
					Duration:  "6h",
					Variables: nil,
					Panels: map[string]*dashboard.Panel{
						"MyInvalidPanel": {
							Spec: dashboard.PanelSpec{
								Plugin:  validFirstPanel,
								Queries: invalidKindQuery,
							},
						},
					},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "schema not found for plugin UnknownGraphQuery",
		},
		{
			title: "dashboard containing a panel with an invalid query (field not allowed)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: dashboard.Spec{
					Duration:  "6h",
					Variables: nil,
					Panels: map[string]*dashboard.Panel{
						"MyInvalidPanel": {
							Spec: dashboard.PanelSpec{
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
				Spec: dashboard.Spec{
					Duration:  "6h",
					Variables: nil,
					Panels: map[string]*dashboard.Panel{
						"MyInvalidPanel": {
							Spec: dashboard.PanelSpec{
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

			err := s.ValidatePanels(test.dashboard.Spec.Panels)

			if test.expectedErrorStr == "" {
				assert.NoError(t, err)
			} else {
				assert.ErrorContains(t, err, test.expectedErrorStr)
			}
		})
	}
}

func TestValidateDashboardVariables(t *testing.T) {
	s := New()
	loadVariablePlugins("testdata/schemas/variables", s, t)
	validFirstVariable := loadPluginFromJSON("testdata/samples/variables/valid_first_variable.json", t)
	validSecondVariable := loadPluginFromJSON("testdata/samples/variables/valid_second_variable.json", t)
	invalidUnknownVariable := loadPluginFromJSON("testdata/samples/variables/invalid_unknown_variable.json", t)

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
				Spec: dashboard.Spec{
					Duration: "6h",
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
					Panels:  map[string]*dashboard.Panel{},
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
				Spec: dashboard.Spec{
					Duration: "6h",
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
					Panels:  map[string]*dashboard.Panel{},
					Layouts: []dashboard.Layout{},
				},
			},
			expectedErrorStr: "schema not found for plugin UnknownVariable",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := s.ValidateDashboardVariables(test.dashboard.Spec.Variables)
			if test.expectedErrorStr == "" {
				assert.NoError(t, err)
			} else {
				assert.ErrorContains(t, err, test.expectedErrorStr)
			}
		})
	}
}

func TestSch_load_SuccessAndMissingPlugin(t *testing.T) {
	// Successful load case
	s := newSch()
	pluginModule := v1.PluginModule{
		Spec: v1.ModuleSpec{
			SchemasPath: "first",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindPanel,
					Spec: module.PluginSpec{Name: "FirstChart"},
				},
			},
		},
	}
	// should load without error
	if err := s.load("testdata/schemas/panels", pluginModule); err != nil {
		t.Fatalf("unexpected error while loading schema: %v", err)
	}
	inst, ok := s.panels.Get("FirstChart", pluginModule.Metadata)
	if !ok || inst == nil {
		t.Fatalf("expected panel schema instance to be registered, got ok=%v, inst=%v", ok, inst)
	}

	// Error case: module spec does not include the matching plugin
	s2 := newSch()
	moduleMissing := v1.PluginModule{
		Spec: v1.ModuleSpec{
			SchemasPath: "first",
			Plugins: []module.Plugin{
				{
					Kind: plugin.KindPanel,
					Spec: module.PluginSpec{Name: "SomeOtherName"},
				},
			},
		},
	}
	if err := s2.load("testdata/schemas/panels", moduleMissing); err == nil {
		t.Fatalf("expected error when plugin list does not contain schema kind")
	} else {
		// give a readable check to ensure it's the expected failure path
		if !strings.Contains(err.Error(), "unable to find the plugin with the associated schema") {
			t.Fatalf("unexpected error message: %v", err)
		}
	}
}

func TestValidateQuerySemantic(t *testing.T) {
	tests := []struct {
		name      string
		plg       plugin.Plugin
		wantErr   bool
		errSubstr string
	}{
		{
			name: "valid PromQL",
			plg: plugin.Plugin{
				Kind: "PrometheusTimeSeriesQuery",
				Spec: map[string]any{"query": "rate(http_requests_total[5m])"},
			},
		},
		{
			name: "invalid PromQL",
			plg: plugin.Plugin{
				Kind: "PrometheusTimeSeriesQuery",
				Spec: map[string]any{"query": "rate(up[)"},
			},
			wantErr:   true,
			errSubstr: "invalid PromQL",
		},
		{
			name: "variable reference skipped",
			plg: plugin.Plugin{
				Kind: "PrometheusTimeSeriesQuery",
				Spec: map[string]any{"query": `rate(http_requests_total{namespace="$namespace"}[5m])`},
			},
		},
		{
			name: "empty query skipped",
			plg: plugin.Plugin{
				Kind: "PrometheusTimeSeriesQuery",
				Spec: map[string]any{"query": ""},
			},
		},
		{
			name: "non-Prometheus plugin skipped",
			plg: plugin.Plugin{
				Kind: "LokiLogQuery",
				Spec: map[string]any{"query": "this is not promql{{{"},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateQuerySemantic(tt.plg, "testPanel", "n°1")
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errSubstr)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
