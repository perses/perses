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
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
)

func TestValidateDashboard(t *testing.T) {
	validFirstPanel, _ := os.ReadFile("testdata/samples/valid_first_panel.json")
	validSecondPanel, _ := os.ReadFile("testdata/samples/valid_second_panel.json")
	validThirdPanel, _ := os.ReadFile("testdata/samples/valid_third_panel.json")
	invalidKind, _ := os.ReadFile("testdata/samples/invalid_kind.json")
	invalidDatasourceKind, _ := os.ReadFile("testdata/samples/invalid_datasource_kind.json")
	invalidSpecMissing, _ := os.ReadFile("testdata/samples/invalid_spec_missing.json")
	invalidUnwantedField, _ := os.ReadFile("testdata/samples/invalid_unwanted_field.json")
	invalidUnwantedQueryField, _ := os.ReadFile("testdata/samples/invalid_unwanted_query_field.json")
	invalidQueryDatasourceMismatch, _ := os.ReadFile("testdata/samples/invalid_query_datasource_mismatch.json")

	metadata := v1.ProjectMetadata{
		Metadata: v1.Metadata{
			Name: "SimpleDashboard",
		},
		Project: "perses",
	}
	datasource := dashboard.Datasource{
		Name: "PrometheusDemo",
		Kind: datasource.PrometheusKind,
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
					Datasource: datasource,
					Duration:   model.Duration(6 * time.Hour),
					Variables:  nil,
					Panels: map[string]json.RawMessage{
						"MyFirstPanel":  validFirstPanel,
						"MySecondPanel": validSecondPanel,
						"MyThirdPanel":  validThirdPanel,
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
					Datasource: datasource,
					Duration:   model.Duration(6 * time.Hour),
					Variables:  nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": invalidKind,
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: Unknown spec.plugin.kind UnknownChart",
		},
		{
			title: "dashboard containing an invalid panel (unknown datasource kind)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Datasource: datasource,
					Duration:   model.Duration(6 * time.Hour),
					Variables:  nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": invalidDatasourceKind,
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: spec.plugin.spec.queries.0: 2 errors in empty disjunction: (and 2 more errors)",
			// TODO : should be: result: "invalid panel MyInvalidPanel: Unknown datasource.kind UnknownDatasource",
		},
		{
			title: "dashboard containing an invalid panel (missing mandatory attribute)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Datasource: datasource,
					Duration:   model.Duration(6 * time.Hour),
					Variables:  nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": invalidSpecMissing,
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: field \"spec\" not found",
		},
		{
			title: "dashboard containing an invalid panel (panel field not allowed)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Datasource: datasource,
					Duration:   model.Duration(6 * time.Hour),
					Variables:  nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": invalidUnwantedField,
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: spec.display: field not allowed: aaaaaa",
		},
		{
			title: "dashboard containing an invalid panel (query field not allowed)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Datasource: datasource,
					Duration:   model.Duration(6 * time.Hour),
					Variables:  nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": invalidUnwantedQueryField,
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: spec.plugin.spec.queries.0: 2 errors in empty disjunction: (and 2 more errors)",
			// TODO : should be: result: "invalid panel MyInvalidPanel: options.queries.0: field not allowed: unwanted",
		},
		{
			title: "dashboard containing an invalid panel (query not matching datasource type)",
			dashboard: &v1.Dashboard{
				Kind:     v1.KindDashboard,
				Metadata: metadata,
				Spec: v1.DashboardSpec{
					Datasource: datasource,
					Duration:   model.Duration(6 * time.Hour),
					Variables:  nil,
					Panels: map[string]json.RawMessage{
						"MyInvalidPanel": invalidQueryDatasourceMismatch,
					},
					Layouts: []dashboard.Layout{},
				},
			},
			result: "invalid panel MyInvalidPanel: spec.plugin.spec.queries.0: 2 errors in empty disjunction: (and 2 more errors)",
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
