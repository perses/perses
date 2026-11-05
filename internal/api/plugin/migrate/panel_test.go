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

package migrate

import (
	"encoding/json"
	"fmt"
	"testing"

	"cuelang.org/go/cue/build"
	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func stubQueryScript(plg *plugin.Plugin, empty bool, err error) func(*build.Instance, []byte) (*plugin.Plugin, bool, error) {
	return func(_ *build.Instance, _ []byte) (*plugin.Plugin, bool, error) {
		return plg, empty, err
	}
}

func TestMigrateQuery(t *testing.T) {
	target := json.RawMessage(`{"expr":"up"}`)

	tests := []struct {
		name           string
		queries        map[string]*queryInstance
		stub           func(*build.Instance, []byte) (*plugin.Plugin, bool, error)
		wantEmpty      bool
		wantQueryKinds []string
	}{
		{
			name:           "no queries - returns true (triggers fallback)",
			queries:        map[string]*queryInstance{},
			stub:           stubQueryScript(nil, true, nil),
			wantEmpty:      true,
			wantQueryKinds: nil,
		},
		{
			name: "single match - appends query and returns false",
			queries: map[string]*queryInstance{
				"PromQuery": {kind: plugin.KindQuery},
			},
			stub:           stubQueryScript(&plugin.Plugin{Kind: "PromQuery"}, false, nil),
			wantEmpty:      false,
			wantQueryKinds: []string{string(plugin.KindQuery)},
		},
		{
			name: "ambiguous match - two plugins match same target - returns true without appending",
			queries: map[string]*queryInstance{
				"PluginA": {kind: plugin.KindQuery},
				"PluginB": {kind: plugin.KindQuery},
			},
			stub:           stubQueryScript(&plugin.Plugin{Kind: "SomePlugin"}, false, nil),
			wantEmpty:      true,
			wantQueryKinds: nil,
		},
		{
			name: "all scripts return empty - returns true (triggers fallback)",
			queries: map[string]*queryInstance{
				"PluginA": {kind: plugin.KindQuery},
			},
			stub:           stubQueryScript(nil, true, nil),
			wantEmpty:      true,
			wantQueryKinds: nil,
		},
		{
			name: "all scripts return error - returns true (triggers fallback)",
			queries: map[string]*queryInstance{
				"PluginA": {kind: plugin.KindQuery},
			},
			stub:           stubQueryScript(nil, false, fmt.Errorf("cue evaluation error")),
			wantEmpty:      true,
			wantQueryKinds: nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			executeQueryScript = tc.stub
			t.Cleanup(func() { executeQueryScript = ExecuteQueryScript })

			result := &dashboard.Panel{}
			isEmpty := migrateQuery(tc.queries, target, result)

			assert.Equal(t, tc.wantEmpty, isEmpty)
			require.Len(t, result.Spec.Queries, len(tc.wantQueryKinds))
			for i, kind := range tc.wantQueryKinds {
				assert.Equal(t, kind, result.Spec.Queries[i].Kind)
			}
		})
	}
}
