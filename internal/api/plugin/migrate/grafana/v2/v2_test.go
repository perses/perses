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

package v2

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func readTestFile(t *testing.T, name string) []byte {
	t.Helper()
	data, err := os.ReadFile(filepath.Join("testdata", name)) //nolint: gosec
	require.NoError(t, err)
	return data
}

// TestToClassic converts the dashboards of the folder testdata, and compares them with their expected classic JSON
// model. The files are <name>.json for the spec using the schema v2, and <name>_classic.json for the expected result.
func TestToClassic(t *testing.T) {
	tests := []struct {
		title string
		name  string
	}{
		{title: "panels, queries and transformations", name: "panels"},
		{title: "variables and annotations, including the ones of a row", name: "variables_and_annotations"},
		{title: "rows, including the collapsed, the nested and the one without header", name: "rows_layout"},
		{title: "tabs and auto grid", name: "tabs_and_auto_grid_layouts"},
		{title: "auto grid with the default settings", name: "auto_grid_defaults"},
		{title: "auto grid with settings out of range", name: "auto_grid_out_of_range"},
		{title: "rows without header that can't be placed without row", name: "hidden_header_rows"},
		{title: "unknown and missing elements", name: "unknown_and_missing_elements"},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			result, err := ToClassic("test", readTestFile(t, test.name+".json"))
			require.NoError(t, err)
			assert.JSONEq(t, string(readTestFile(t, test.name+"_classic.json")), string(result))
		})
	}
}

func TestToClassicErrors(t *testing.T) {
	tests := []struct {
		title         string
		spec          string
		expectedError string
	}{
		{
			title:         "invalid spec",
			spec:          `{"title": 1}`,
			expectedError: "unable to decode the spec: ",
		},
		{
			title:         "unsupported layout",
			spec:          `{"title": "Test", "layout": {"kind": "MasonryLayout", "spec": {}}}`,
			expectedError: `unsupported layout kind "MasonryLayout"`,
		},
		{
			title: "unsupported nested layout",
			spec: `{"title": "Test", "layout": {"kind": "TabsLayout", "spec": {"tabs": [
  {"kind": "TabsLayoutTab", "spec": {"title": "Tab", "layout": {"kind": "MasonryLayout", "spec": {}}}}]}}}`,
			expectedError: `unsupported layout kind "MasonryLayout"`,
		},
		{
			title: "invalid panel",
			spec: `{"title": "Test", "elements": {"p": {"kind": "Panel", "spec": {"title": 1}}}, "layout": {"kind": "GridLayout", "spec": {"items": [
  {"kind": "GridLayoutItem", "spec": {"element": {"kind": "ElementReference", "name": "p"}}}]}}}`,
			expectedError: `unable to decode the panel "p": `,
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			_, err := ToClassic("test", json.RawMessage(test.spec))
			assert.ErrorContains(t, err, test.expectedError)
		})
	}
}
