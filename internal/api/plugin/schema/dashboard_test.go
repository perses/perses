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
	"fmt"
	"strings"
	"testing"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/parser"
	apiCue "github.com/perses/perses/internal/api/cue"
	specPlugin "github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDashboardToCue(t *testing.T) {
	ctx := cuecontext.New()
	result, err := dashboardToCue(ctx)
	require.NoError(t, err)

	dashDef := result.LookupPath(cue.MakePath(cue.Def("#Dashboard")))
	assert.True(t, dashDef.Exists(), "expected #Dashboard definition in the result")

	assert.NoError(t, result.Validate(dashboardCueValidationOptions...))
}

func TestGenerateDashboardCueValueWithNoPluginKinds(t *testing.T) {
	ctx := cuecontext.New()
	// No plugins injected: the base dashboard schema must still be returned intact.
	result, err := generateDashboardCueValue(ctx, map[specPlugin.Kind]schemaDisjunction{})
	require.NoError(t, err)

	dashDef := result.LookupPath(cue.MakePath(cue.Def("#Dashboard")))
	assert.True(t, dashDef.Exists(), "expected #Dashboard definition even with no plugins")
}

func TestGenerateDashboardCueValueWithAllPluginKinds(t *testing.T) {
	ctx := cuecontext.New()
	makePlugin := func(kind string) schemaDisjunction {
		expr, err := parser.ParseExpr("plugin", `{kind: "`+kind+`", spec: {}}`)
		require.NoError(t, err)
		return schemaDisjunction{expr: expr}
	}

	plugins := map[specPlugin.Kind]schemaDisjunction{
		specPlugin.KindPanel:      makePlugin("TestPanel"),
		specPlugin.KindDatasource: makePlugin("TestDatasource"),
		specPlugin.KindQuery:      makePlugin("TestQuery"),
		specPlugin.KindVariable:   makePlugin("TestVariable"),
	}

	result, err := generateDashboardCueValue(ctx, plugins)
	require.NoError(t, err)

	vals := make(map[string]cue.Value)

	vals["dashboard definition"] = result.LookupPath(cue.MakePath(cue.Def("#Dashboard")))
	vals["panel plugin value"] = result.LookupPath(cue.MakePath(cue.Def("#Dashboard"), cue.Hid("_PanelSpec_0", "_"), cue.Str("plugin")))
	vals["datasource plugin value"] = result.LookupPath(cue.MakePath(cue.Def("#Dashboard"), cue.Hid("_Spec_1", "_"), cue.Str("plugin")))
	vals["query plugin value"] = result.LookupPath(cue.MakePath(cue.Def("#Dashboard"), cue.Hid("_QuerySpec_0", "_"), cue.Str("plugin")))
	vals["variable plugin value"] = result.LookupPath(cue.MakePath(cue.Def("#Dashboard"), cue.Hid("_Variable_0", "_")))

	for name, value := range vals {
		assert.True(t, value.Exists(), fmt.Sprintf("%s should exist", name))            // check if value exists
		assert.False(t, value.IsNull(), fmt.Sprintf("%s should contain a value", name)) // check if it is not null
		assert.False(t, value.Equals(ctx.CompileString(`_Plugin_0`)))                   // check if it is more than just the default `_Plugin_0`
	}
}

// TestGeneratedDashboardSchemaValidatesDashboards validates dashboards against the schema as it is served by
// /api/v1/schemas/dashboards (exported CUE), the way `cue vet -d '#Dashboard' schema.cue dashboard.json` does.
func TestGeneratedDashboardSchemaValidatesDashboards(t *testing.T) {
	ctx := cuecontext.New()
	panels, err := generateSchemaDisjunction(ctx, []LoadSchema{
		loadSchemaFromTestdata(t, "testdata/schemas/panels/first"),
		loadSchemaFromTestdata(t, "testdata/dashboard_schema/panels/palette"),
	})
	require.NoError(t, err)
	variable := loadSchemaFromTestdata(t, "testdata/schemas/variables/first")
	variable.Kind = specPlugin.KindVariable
	variables, err := generateSchemaDisjunction(ctx, []LoadSchema{variable})
	require.NoError(t, err)

	generated, err := generateDashboardCueValue(ctx, map[specPlugin.Kind]schemaDisjunction{
		specPlugin.KindPanel:    panels,
		specPlugin.KindVariable: variables,
	})
	require.NoError(t, err)
	exported, err := apiCue.Marshal(generated)
	require.NoError(t, err)
	schema := ctx.CompileBytes(exported)
	require.NoError(t, schema.Err())
	dashboardDef := schema.LookupPath(cue.MakePath(cue.Def("#Dashboard")))
	require.NoError(t, dashboardDef.Err())

	// each plugin schema is declared once, as a top-level definition referenced by the dashboard schema
	for _, def := range []string{"#Plugin_Panel_FirstChart", "#Plugin_Panel_PaletteChart", "#Plugin_Variable_FirstVariable"} {
		assert.True(t, schema.LookupPath(cue.MakePath(cue.Def(def))).Exists(), "expected definition %s", def)
	}
	for _, kind := range []string{"FirstChart", "PaletteChart", "FirstVariable"} {
		assert.Equal(t, 1, strings.Count(string(exported), `kind: "`+kind+`"`), "plugin %s should be declared once", kind)
	}

	const metadata = `"metadata": {"name": "test", "project": "test"}`
	testSuite := []struct {
		title     string
		dashboard string
		wantErr   bool
	}{
		{
			title:     "server-managed metadata (createdAt, updatedAt, version) is optional",
			dashboard: `{"kind": "Dashboard", ` + metadata + `, "spec": {"panels": {}, "layouts": [], "duration": "1h"}}`,
		},
		{
			title: "server-managed metadata is accepted",
			dashboard: `{"kind": "Dashboard", "metadata": {"name": "test", "project": "test", "createdAt": "2026-01-01T00:00:00Z", "updatedAt": "2026-01-01T00:00:00Z", "version": 3},
				"spec": {"panels": {}, "layouts": [], "duration": "1h"}}`,
		},
		{
			title:     "project is still required",
			dashboard: `{"kind": "Dashboard", "metadata": {"name": "test"}, "spec": {"panels": {}, "layouts": [], "duration": "1h"}}`,
			wantErr:   true,
		},
		{
			title: "variable display without hidden",
			dashboard: `{"kind": "Dashboard", ` + metadata + `, "spec": {"panels": {}, "layouts": [], "duration": "1h", "variables": [
				{"kind": "TextVariable", "spec": {"name": "text", "value": "v", "display": {"name": "Text"}}},
				{"kind": "ListVariable", "spec": {"name": "list", "allowAllValue": false, "allowMultiple": false, "display": {"name": "List"}, "plugin": {"kind": "FirstVariable", "spec": {"a": "a", "b": "b"}}}}
			]}}`,
		},
		{
			title: "panel plugin with a definition-based palette, palette not set",
			dashboard: `{"kind": "Dashboard", ` + metadata + `, "spec": {"layouts": [], "duration": "1h",
				"panels": {"p": {"kind": "Panel", "spec": {"display": {"name": "p"}, "plugin": {"kind": "PaletteChart", "spec": {}}}}}}}`,
		},
		{
			title: "panel plugin with a valid categorical palette",
			dashboard: `{"kind": "Dashboard", ` + metadata + `, "spec": {"layouts": [], "duration": "1h",
				"panels": {"p": {"kind": "Panel", "spec": {"display": {"name": "p"}, "plugin": {"kind": "PaletteChart", "spec": {"visual": {"palette": {"mode": "categorical", "name": "tableau10"}}}}}}}}}`,
		},
		{
			title: "panel plugin with an invalid palette name",
			dashboard: `{"kind": "Dashboard", ` + metadata + `, "spec": {"layouts": [], "duration": "1h",
				"panels": {"p": {"kind": "Panel", "spec": {"display": {"name": "p"}, "plugin": {"kind": "PaletteChart", "spec": {"visual": {"palette": {"mode": "categorical", "name": "unknown"}}}}}}}}}`,
			wantErr: true,
		},
		{
			title: "panel plugin with a palette name in auto mode",
			dashboard: `{"kind": "Dashboard", ` + metadata + `, "spec": {"layouts": [], "duration": "1h",
				"panels": {"p": {"kind": "Panel", "spec": {"display": {"name": "p"}, "plugin": {"kind": "PaletteChart", "spec": {"visual": {"palette": {"mode": "auto", "name": "tableau10"}}}}}}}}}`,
			wantErr: true,
		},
		{
			title: "panel plugin with an unknown field",
			dashboard: `{"kind": "Dashboard", ` + metadata + `, "spec": {"layouts": [], "duration": "1h",
				"panels": {"p": {"kind": "Panel", "spec": {"display": {"name": "p"}, "plugin": {"kind": "PaletteChart", "spec": {"unknown": true}}}}}}}`,
			wantErr: true,
		},
		{
			title: "other panel plugin without definitions",
			dashboard: `{"kind": "Dashboard", ` + metadata + `, "spec": {"layouts": [], "duration": "1h",
				"panels": {"p": {"kind": "Panel", "spec": {"display": {"name": "p"}, "plugin": {"kind": "FirstChart", "spec": {"a": "a", "b": {"c": [{"e": "e"}]}}}}}}}}`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			dashboard := ctx.CompileString(test.dashboard)
			require.NoError(t, dashboard.Err())
			err := dashboardDef.Unify(dashboard).Validate(cue.Concrete(true))
			if test.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
