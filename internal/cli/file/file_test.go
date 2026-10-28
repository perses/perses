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

package file

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeTemp(t *testing.T, name, content string) string {
	t.Helper()
	p := filepath.Join(t.TempDir(), name)
	if err := os.WriteFile(p, []byte(content), 0o600); err != nil {
		t.Fatalf("unable to write test file: %v", err)
	}
	return p
}

func TestUnmarshalEntitiesFromFile(t *testing.T) {
	testSuite := []struct {
		title           string
		content         string
		isErrorExpected bool
		expectedCount   int
		expectedKinds   []string
		expectedNames   []string
	}{
		{
			title: "single YAML document",
			content: `kind: Project
metadata:
  name: my-project
`,
			expectedCount: 1,
			expectedKinds: []string{"Project"},
			expectedNames: []string{"my-project"},
		},
		{
			// multi-document YAML separated by --- markers
			title: "multi-document YAML",
			content: `kind: Project
metadata:
  name: first-project
---
kind: Project
metadata:
  name: second-project
`,
			expectedCount: 2,
			expectedKinds: []string{"Project", "Project"},
			expectedNames: []string{"first-project", "second-project"},
		},
		{
			// consecutive --- separators produce empty documents that must be skipped
			title: "multi-document YAML with empty documents",
			content: `---
kind: Project
metadata:
  name: first-project
---
---
kind: Project
metadata:
  name: second-project
---
`,
			expectedCount: 2,
			expectedKinds: []string{"Project", "Project"},
			expectedNames: []string{"first-project", "second-project"},
		},
		{
			// top-level YAML list treated as multiple resources in a single document
			title: "YAML list",
			content: `- kind: Project
  metadata:
    name: first-project
- kind: Project
  metadata:
    name: second-project
`,
			expectedCount: 2,
			expectedKinds: []string{"Project", "Project"},
			expectedNames: []string{"first-project", "second-project"},
		},
		{
			title:           "invalid YAML content",
			content:         ":\tinvalid: yaml: content\n",
			isErrorExpected: true,
		},
		{
			// a scalar YAML document (not an object or list) must return an error
			title:           "scalar YAML document",
			isErrorExpected: true,
			content: `---
kind: Project
metadata:
  name: first-project
---
---
---
error-message-testing
---
`,
		},
		{
			// a YAML list containing a non-object item must return an error
			title:           "YAML list with non-object item",
			isErrorExpected: true,
			content: `- kind: Project
  metadata:
    name: my-project
- just-a-string
`,
		},
	}

	for _, tc := range testSuite {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()
			p := writeTemp(t, "resources.yaml", tc.content)
			entities, err := UnmarshalEntitiesFromFile(p)
			if tc.isErrorExpected {
				if err == nil {
					t.Fatal("expected an error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("expected no error, got: %v", err)
			}
			if len(entities) != tc.expectedCount {
				t.Fatalf("expected %d entities, got %d", tc.expectedCount, len(entities))
			}
			for i, expectedKind := range tc.expectedKinds {
				if entities[i].GetKind() != expectedKind {
					t.Errorf("entities[%d]: expected kind %q, got %q", i, expectedKind, entities[i].GetKind())
				}
			}
			for i, expectedName := range tc.expectedNames {
				if entities[i].GetMetadata().GetName() != expectedName {
					t.Errorf("entities[%d]: expected name %q, got %q", i, expectedName, entities[i].GetMetadata().GetName())
				}
			}
		})
	}
}

func TestUnmarshalResourcesFromData(t *testing.T) {
	yamlContent := `kind: Project
metadata:
  name: first-project
---
metadata:
  name: no-kind
---
---
kind: Dashboard
metadata:
  name: empty
  project: first-project
---
- 42
- kind: Project
  metadata:
    name: second-project
`
	jsonContent := `[{"kind":"Project","metadata":{"name":"first-project"}},{"metadata":{"name":"no-kind"}},{"kind":"Dashboard","metadata":{"name":"empty","project":"first-project"}},42,{"kind":"Project","metadata":{"name":"second-project"}}]`
	for _, test := range []struct {
		title   string
		content string
		isJSON  bool
	}{
		{title: "yaml", content: yamlContent},
		{title: "json", content: jsonContent, isJSON: true},
	} {
		t.Run(test.title, func(t *testing.T) {
			resources, err := UnmarshalResourcesFromData("resources", []byte(test.content), test.isJSON)
			if err != nil {
				t.Fatalf("unexpected file error: %v", err)
			}
			if len(resources) != 5 {
				t.Fatalf("expected 5 resources, got %d", len(resources))
			}
			for i, resource := range resources {
				if resource.Index != i {
					t.Errorf("resources[%d]: expected index %d, got %d", i, i, resource.Index)
				}
			}
			for i, name := range map[int]string{0: "first-project", 4: "second-project"} {
				if resources[i].Err != nil || resources[i].Entity.GetMetadata().GetName() != name {
					t.Errorf("resources[%d]: expected %q, got %v (%v)", i, name, resources[i].Entity, resources[i].Err)
				}
			}
			for _, i := range []int{1, 2, 3} {
				index := fmt.Sprintf("objects[%d]", i)
				if resources[i].Err == nil || !strings.Contains(resources[i].Err.Error(), index) {
					t.Errorf("resources[%d]: expected an error containing %q, got %v", i, index, resources[i].Err)
				}
			}
		})
	}
	if _, fileErr := UnmarshalResourcesFromData("broken.json", []byte(`{not json`), true); fileErr == nil {
		t.Error("expected a file error for invalid JSON")
	}
	if _, fileErr := UnmarshalResourcesFromData("empty.yaml", []byte("---\n"), false); fileErr == nil {
		t.Error("expected a file error for an empty file")
	}
}
