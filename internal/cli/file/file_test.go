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
	"os"
	"path/filepath"
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
