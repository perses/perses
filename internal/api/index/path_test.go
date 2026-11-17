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
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

const pathTestDocument = `{
	"kind": "Dashboard",
	"\"quoted\"": ["first", "second"],
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
		],
		"variables": [
			{"kind": "TextVariable", "spec": {"name": "[42]"}},
			{"kind": "ListVariable", "spec": {"name": "env", "query": "sum(rate(up[5m]))", "values": ["[1, [2]]", "{\"name\": \"in a string\"}"]}}
		],
		"datasources": {"#": {"name": "hash"}}
	}
}`

// lookup returns the value at the path in the document, following it as JavaScript does once the document is parsed:
// unlike gjson, it only finds an item of an array with its index written without leading zeros.
func lookup(document string, path []string) (gjson.Result, bool) {
	value := gjson.Parse(document)
	for _, component := range path {
		var next gjson.Result
		switch {
		case value.IsArray():
			items := value.Array()
			if i, err := strconv.Atoi(component); err == nil && strconv.Itoa(i) == component && i >= 0 && i < len(items) {
				next = items[i]
			}
		case value.IsObject():
			value.ForEach(func(key, v gjson.Result) bool {
				if key.String() == component {
					next = v
					return false
				}
				return true
			})
		}
		if !next.Exists() {
			return gjson.Result{}, false
		}
		value = next
	}
	return value, true
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
		decoded = append(decoded, decodedField{key: keys[f.keyIndex()].key, value: f.value(data), path: f.path(data, keys)})
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
		`@dig:"quoted".0`,
		"metadata.tags.01",
		"spec.variables.#.spec.values.00",
		"spec.panels.@dig:links.01",
		"metadata.tags.9223372036854775808",
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
		{
			// gjson evaluates the fields together, so it doesn't search the rest of the key in the string "[42]".
			title:         "fields continuing in a string",
			key:           "spec.variables.#.spec.name.0",
			expectedPaths: nil,
		},
		{
			title:         "fields continuing in a string, searched by dig",
			key:           "spec.variables.@dig:query.0",
			expectedPaths: nil,
		},
		{
			// gjson searches the key in each value found by @dig, as in a new document, so it finds 42 in the string
			// "[42]", whose path can't be represented.
			title:         "dig finding a value in a string",
			key:           "spec.variables.0.spec.@dig:0",
			expectedPaths: [][]string{nil},
		},
		{
			// gjson evaluates the rest of the key on each item, as on a new document, so it finds [2] in the string
			// "[1, [2]]".
			title:         "array item finding a value in a string",
			key:           "spec.variables.1.spec.values.#.1",
			expectedPaths: [][]string{nil},
		},
		{
			title:         "# key of an object",
			key:           "spec.datasources.#.name",
			expectedPaths: [][]string{{"spec", "datasources", "#", "name"}},
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
	b.appendPathlessField("unsupported")
	b.key, b.names = 1, k.names
	b.appendField("value", end)
	b.appendField("", nil)
	b.appendField("CPU usage", []string{"cpu", "spec", "display", "name"})
	b.appendPathlessField("in a string")
	data := string(b.data)
	fields := decodeFields(keys, data, b.fields)
	assert.Equal(t, []decodedField{
		{key: "metadata.tags|@reverse", value: "unsupported"},
		{key: k.key, value: "value", path: append([]string{"spec", "panels"}, end...)},
		{key: k.key, value: "", path: []string{"spec", "panels"}},
		{key: k.key, value: "CPU usage", path: []string{"spec", "panels", "cpu", "spec", "display", "name"}},
		{key: k.key, value: "in a string"},
	}, fields)
	// "cpu" is stored with its length, and the step names of the key are stored as references of a byte each.
	assert.Equal(t, uint32(1+len("cpu")+3), b.fields[3].end-b.fields[3].valueEnd)

	// Each call returns a new slice, so modifying it doesn't modify the next ones.
	fields[1].path[0] = "modified"
	assert.Equal(t, "spec", b.fields[1].path(data, keys)[0])
}

// setMaxDataSize lowers the maximum size of the data of a document for the duration of the test.
func setMaxDataSize(t *testing.T, size uint64) {
	t.Helper()
	previous := maxDataSize
	maxDataSize = size
	t.Cleanup(func() { maxDataSize = previous })
}

func TestFieldsBuilder_stopsAtTheFirstFieldNotFitting(t *testing.T) {
	setMaxDataSize(t, 10)
	k, err := newIndexedKey("metadata.tags")
	require.NoError(t, err)
	var b fieldsBuilder
	b.reset()
	b.names = k.names
	// The field takes 7 bytes: 5 for the value and 2 for its path, the length of the index then the index.
	b.appendField("first", []string{"0"})
	// The value fits, but not its path.
	b.appendField("s", []string{"10"})
	// The field fits, but it follows a field that doesn't.
	b.appendField("", nil)

	assert.True(t, b.tooLarge)
	assert.Len(t, b.data, 7)
	assert.Equal(t, []decodedField{{key: k.key, value: "first", path: []string{"metadata", "tags", "0"}}}, decodeFields([]indexedKey{k}, string(b.data), b.fields))

	b.reset()
	assert.False(t, b.tooLarge)
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
		"spec.variables.#.spec.name.0",
		"spec.variables.@dig:query.0",
		"spec.variables.0.spec.@dig:0",
		"spec.variables.1.spec.values.#.1",
		"spec.datasources.#.name",
		`@dig:"quoted".0`,
		"metadata.tags.01",
		"spec.variables.#.spec.values.01",
		"spec.panels.@dig:links.00",
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
// and that the path of each field, when it can be determined, leads to its value.
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
		if f.path != nil {
			value, found := lookup(pathTestDocument, f.path)
			assert.True(t, found, "path %q", f.path)
			assert.Equal(t, f.value, value.String(), "path %q", f.path)
		}
	}
	assert.ElementsMatch(t, expectedValues, values, "key %q", key)
}
