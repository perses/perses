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
	"testing"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
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
	result, err := generateDashboardCueValue(ctx, map[specPlugin.Kind]cue.Value{})
	require.NoError(t, err)

	dashDef := result.LookupPath(cue.MakePath(cue.Def("#Dashboard")))
	assert.True(t, dashDef.Exists(), "expected #Dashboard definition even with no plugins")
}

func TestGenerateDashboardCueValueWithAllPluginKinds(t *testing.T) {
	ctx := cuecontext.New()
	makePlugin := func(kind string) cue.Value {
		v := ctx.CompileString(`kind: "` + kind + `", spec: {}`)
		require.NoError(t, v.Err())
		return v
	}

	plugins := map[specPlugin.Kind]cue.Value{
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
