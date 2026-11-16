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

// decodedField is an indexed field with its key, its value and its path, to compare the fields in the tests.
type decodedField struct {
	key   string
	value string
	path  []string
}

// decodeFields returns the fields stored in the data of a document, extracted with the given indexed keys.
func decodeFields(keys []indexedKey, data string, fields []indexedField) []decodedField {
	decoded := make([]decodedField, 0, len(fields))
	for _, f := range fields {
		decoded = append(decoded, decodedField{key: keys[f.key].key, value: f.value(data), path: f.path(data, keys)})
	}
	return decoded
}

// extractTestFields returns the fields extracted with the key from pathTestDocument.
func extractTestFields(k indexedKey) []decodedField {
	var b fieldsBuilder
	b.reset()
	b.extractKeyFields([]byte(pathTestDocument), 0, k)
	return decodeFields([]indexedKey{k}, string(b.data), b.fields)
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
			k, err := newIndexedKey(tc.key)
			require.NoError(t, err)
			fields := extractTestFields(k)

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

func TestIndexedField_path(t *testing.T) {
	k, err := newIndexedKey("spec.panels.@dig:display.name")
	require.NoError(t, err)
	require.Equal(t, []string{"spec", "panels", "display", "name"}, k.names)
	keys := []indexedKey{{key: "metadata.tags|@reverse"}, k}
	// The lengths of the components are encoded on 1, 2 and 3 bytes.
	end := []string{"", "a", strings.Repeat("b", 127), strings.Repeat("c", 128), strings.Repeat("d", 16384), "\x00\x80\xff"}
	var b fieldsBuilder
	b.reset()
	b.key, b.names = 0, keys[0].names
	b.appendField("unsupported", nil)
	b.key, b.names = 1, k.names
	b.appendField("value", end)
	b.appendField("", nil)
	b.appendField("CPU usage", []string{"cpu", "spec", "display", "name"})
	data := string(b.data)
	fields := decodeFields(keys, data, b.fields)
	assert.Equal(t, []decodedField{
		{key: "metadata.tags|@reverse", value: "unsupported"},
		{key: k.key, value: "value", path: append([]string{"spec", "panels"}, end...)},
		{key: k.key, value: "", path: []string{"spec", "panels"}},
		{key: k.key, value: "CPU usage", path: []string{"spec", "panels", "cpu", "spec", "display", "name"}},
	}, fields)
	// "cpu" is stored with its length, and the step names of the key are stored as references of a byte each.
	assert.Equal(t, uint32(1+len("cpu")+3), b.fields[3].end-b.fields[3].valueEnd)

	// Each call returns a new slice, so modifying it doesn't modify the next ones.
	fields[1].path[0] = "modified"
	assert.Equal(t, "spec", b.fields[1].path(data, keys)[0])
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
		k, err := newIndexedKey(key)
		if err != nil {
			return
		}
		assertSameFieldsAsGjson(t, key, extractTestFields(k))
	})
}

// assertSameFieldsAsGjson checks that the values of the fields are the ones gjson returns for the key,
// and that the path of each field leads to its value.
func assertSameFieldsAsGjson(t *testing.T, key string, fields []decodedField) {
	t.Helper()
	var expected fieldsBuilder
	expected.recursiveDeepExtractFields([]gjson.Result{gjson.Get(pathTestDocument, key)})
	expectedValues := make([]string, 0, len(expected.fields))
	for _, f := range expected.fields {
		expectedValues = append(expectedValues, f.value(string(expected.data)))
	}
	values := make([]string, 0, len(fields))
	for _, f := range fields {
		values = append(values, f.value)
		assert.Equal(t, f.value, gjson.Get(pathTestDocument, gjsonPath(f.path)).String(), "path %q", f.path)
	}
	assert.ElementsMatch(t, expectedValues, values, "key %q", key)
}
