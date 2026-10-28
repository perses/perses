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

package index

import (
	"strings"
	"testing"
	"unicode"

	"github.com/perses/perses/pkg/model/api/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

const pathTestDocument = `{
	"kind": "Dashboard",
	"metadata": {"name": "mydashboard", "project": "myproject", "tags": ["kubernetes", "production"]},
	"spec": {
		"display": {"name": "My Dashboard"},
		"panels": {
			"cpu": {"kind": "Panel", "spec": {"display": {"name": "CPU usage"}}},
			"my.memory": {"kind": "Panel", "spec": {"display": {"name": "Memory usage"}, "links": [{"name": "doc"}]}}
		},
		"layouts": [
			{"kind": "Grid", "spec": {"display": {"title": "Resources"}}},
			{"kind": "Grid", "spec": {"display": {"title": "Network"}}}
		]
	}
}`

// gjsonPath converts a path into a gjson path, escaping the special characters of each component.
func gjsonPath(path []string) string {
	components := make([]string, len(path))
	for i, p := range path {
		var b strings.Builder
		for _, r := range p {
			if !unicode.IsLetter(r) && !unicode.IsDigit(r) {
				b.WriteByte('\\')
			}
			b.WriteRune(r)
		}
		components[i] = b.String()
	}
	return strings.Join(components, ".")
}

func TestExtractFields(t *testing.T) {
	testsCases := []struct {
		title         string
		key           string
		expectedPaths [][]string
	}{
		{
			title:         "simple key",
			key:           "metadata.name",
			expectedPaths: [][]string{{"metadata", "name"}},
		},
		{
			title:         "array",
			key:           "metadata.tags",
			expectedPaths: [][]string{{"metadata", "tags", "0"}, {"metadata", "tags", "1"}},
		},
		{
			title:         "array item",
			key:           "metadata.tags.1",
			expectedPaths: [][]string{{"metadata", "tags", "1"}},
		},
		{
			title: "dig",
			key:   "spec.panels.@dig:display.name",
			expectedPaths: [][]string{
				{"spec", "panels", "cpu", "spec", "display", "name"},
				{"spec", "panels", "my.memory", "spec", "display", "name"},
			},
		},
		{
			title: "every item of an array",
			key:   "spec.layouts.#.spec.display.title",
			expectedPaths: [][]string{
				{"spec", "layouts", "0", "spec", "display", "title"},
				{"spec", "layouts", "1", "spec", "display", "title"},
			},
		},
		{
			title:         "wildcard selects the first matching key, like gjson",
			key:           "spec.panels.*.spec.display.name",
			expectedPaths: [][]string{{"spec", "panels", "cpu", "spec", "display", "name"}},
		},
		{
			title:         "escaped dot",
			key:           `spec.panels.my\.memory.spec.links`,
			expectedPaths: [][]string{{"spec", "panels", "my.memory", "spec", "links", "0", "name"}},
		},
		{
			title:         "missing key",
			key:           "spec.unknown.field",
			expectedPaths: nil,
		},
	}
	document := gjson.Parse(pathTestDocument)
	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			steps, ok := compileKey(tc.key)
			require.True(t, ok)
			var fields []indexedField
			extractFields(document, steps, tc.key, nil, &fields)

			var paths [][]string
			for _, f := range fields {
				assert.Equal(t, tc.key, f.key)
				// Each path must lead to its value.
				assert.Equal(t, f.value, gjson.Get(pathTestDocument, gjsonPath(f.path)).String())
				paths = append(paths, f.path)
			}
			assert.Equal(t, tc.expectedPaths, paths)

			// The values must be the same as the ones gjson returns for the key.
			var expectedFields []indexedField
			recursiveDeepExtractFields([]gjson.Result{gjson.Get(pathTestDocument, tc.key)}, tc.key, &expectedFields)
			var values, expectedValues []string
			for _, f := range fields {
				values = append(values, f.value)
			}
			for _, f := range expectedFields {
				expectedValues = append(expectedValues, f.value)
			}
			assert.ElementsMatch(t, expectedValues, values)
		})
	}
}

func TestCompileKey_unsupportedSyntax(t *testing.T) {
	for _, key := range []string{
		"",
		"spec.panels.@values",
		"metadata.tags|@reverse",
		"spec.layouts.#(kind==Grid)",
		"metadata.tags.#",
		"{metadata.name,metadata.project}",
		"spec.panels.@dig:{\"a\":1}",
		"metadata..name",
		"metadata.name.",
	} {
		t.Run(key, func(t *testing.T) {
			_, ok := compileKey(key)
			assert.False(t, ok)
		})
	}
}

func TestClientAdd_unsupportedKeyOnlyReturnsTheKey(t *testing.T) {
	c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: []string{"metadata.tags|@reverse"}}}, newDisabledAuthz(t), nil).(*client)
	require.NoError(t, c.add([]byte(pathTestDocument)))

	fields := c.dashboards.idx["myproject"]["mydashboard"].fields
	assert.ElementsMatch(t, []indexedField{
		{key: "metadata.tags|@reverse", value: "kubernetes"},
		{key: "metadata.tags|@reverse", value: "production"},
	}, fields)
}
