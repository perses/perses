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

func TestCompileKey_unsupportedSyntax(t *testing.T) {
	for _, key := range []string{
		"",
		"spec.panels.@values",
		"metadata.tags|@reverse",
		"spec.layouts.#(kind==Grid)",
		"metadata.tags.#",
		"{metadata.name,metadata.project}",
		`spec.panels.@dig:{"a":1}`,
		"metadata..name",
		"metadata.name.",
		"spec.panels.*.spec.display.name",
		"metadata.na?e",
		`metadata.name\`,
		`\`,
		`spec.panels.@dig:display\|name`,
		"spec.panels.@dig:",
	} {
		t.Run(key, func(t *testing.T) {
			_, err := compileKey(key)
			assert.Error(t, err)
		})
	}
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
	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			steps, err := compileKey(tc.key)
			require.NoError(t, err)
			var fields []indexedField
			extractFields(gjson.Parse(pathTestDocument), steps, tc.key, nil, &fields)

			var paths [][]string
			for _, f := range fields {
				assert.Equal(t, tc.key, f.key)
				paths = append(paths, f.path)
			}
			assert.Equal(t, tc.expectedPaths, paths)
			assertSameFieldsAsGjson(t, tc.key, fields)
		})
	}
}

// FuzzExtractFields checks that, for any supported key, the values extracted are the ones gjson returns for the key,
// and that the path of each value leads to it.
func FuzzExtractFields(f *testing.F) {
	for _, key := range []string{
		"metadata.name",
		"metadata.tags",
		"metadata.tags.1",
		"spec.panels.@dig:display.name",
		"spec.layouts.#.spec.display.title",
		`spec.panels.my\.memory.spec.links`,
		"spec.panels.*.kind",
		`metadata.name\`,
	} {
		f.Add(key)
	}
	f.Fuzz(func(t *testing.T, key string) {
		steps, err := compileKey(key)
		if err != nil {
			return
		}
		var fields []indexedField
		extractFields(gjson.Parse(pathTestDocument), steps, key, nil, &fields)
		assertSameFieldsAsGjson(t, key, fields)
	})
}

// assertSameFieldsAsGjson checks that the values of the fields are the ones gjson returns for the key,
// and that the path of each field leads to its value.
func assertSameFieldsAsGjson(t *testing.T, key string, fields []indexedField) {
	t.Helper()
	var expectedFields []indexedField
	recursiveDeepExtractFields([]gjson.Result{gjson.Get(pathTestDocument, key)}, key, &expectedFields)
	expectedValues := make([]string, 0, len(expectedFields))
	for _, f := range expectedFields {
		expectedValues = append(expectedValues, f.value)
	}
	values := make([]string, 0, len(fields))
	for _, f := range fields {
		values = append(values, f.value)
		assert.Equal(t, f.value, gjson.Get(pathTestDocument, gjsonPath(f.path)).String(), "path %q", f.path)
	}
	assert.ElementsMatch(t, expectedValues, values, "key %q", key)
}
