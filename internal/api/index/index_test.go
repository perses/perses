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
	"encoding/json"
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newGlobalClient(kind v1.Kind, indexedKeys []string) *client {
	return &client{
		kind:        kind,
		indexedKeys: indexedKeys,
		idx:         make(map[string]index[*v1.Metadata]),
		projectIdx:  make(map[string]map[string]index[*v1.ProjectMetadata]),
	}
}

func TestClientAdd(t *testing.T) {
	testsCases := []struct {
		title              string
		kind               v1.Kind
		raw                json.RawMessage
		indexedKeys        []string
		expectedIdx        map[string]index[*v1.Metadata]
		expectedProjectIdx map[string]map[string]index[*v1.ProjectMetadata]
	}{
		{
			title: "add global resource",
			kind:  v1.KindProject,
			raw: json.RawMessage(`{
		"kind": "Project",
		"metadata": {
			"name": "myproject"
		},
		"spec": {}
	}`),
			indexedKeys: []string{"metadata.name"},
			expectedIdx: map[string]index[*v1.Metadata]{
				"myproject": {
					metadata: &v1.Metadata{
						Name: "myproject",
					},
					displayName: "myproject",
					fields:      []string{"myproject"},
				},
			},
		},
		{
			title: "add project resource",
			kind:  v1.KindDashboard,
			raw: json.RawMessage(`{
		"kind": "Dashboard",
		"metadata": {
			"name": "mydashboard",
			"project": "myproject"
		},
		"spec": {}
	}`),
			indexedKeys: []string{"metadata.name", "metadata.project"},
			expectedProjectIdx: map[string]map[string]index[*v1.ProjectMetadata]{
				"myproject": {
					"mydashboard": {
						metadata: &v1.ProjectMetadata{
							Metadata: v1.Metadata{
								Name: "mydashboard",
							},
							ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
								Project: "myproject",
							},
						},
						displayName: "mydashboard",
						fields:      []string{"mydashboard", "myproject"},
					},
				},
			},
		},
		{
			title: "add dashboard with display name",
			kind:  v1.KindDashboard,
			raw: json.RawMessage(`{
		"kind": "Dashboard",
		"metadata": {
			"name": "mydashboard",
			"project": "myproject"
		},
		"spec": {
			"display": {
				"name": "My Fancy Dashboard"
			}
		}
	}`),
			indexedKeys: []string{"metadata.name", "metadata.project", "spec.display.name"},
			expectedProjectIdx: map[string]map[string]index[*v1.ProjectMetadata]{
				"myproject": {
					"mydashboard": {
						metadata: &v1.ProjectMetadata{
							Metadata: v1.Metadata{
								Name: "mydashboard",
							},
							ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
								Project: "myproject",
							},
						},
						displayName: "My Fancy Dashboard",
						fields:      []string{"mydashboard", "myproject", "My Fancy Dashboard"},
					},
				},
			},
		},
	}
	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			c := newGlobalClient(tc.kind, tc.indexedKeys)
			err := c.add(tc.raw)
			require.NoError(t, err)
			if v1.IsGlobal(tc.kind) {
				assert.Equal(t, tc.expectedIdx, c.idx)
				assert.Empty(t, c.projectIdx)
			} else {
				assert.Equal(t, tc.expectedProjectIdx, c.projectIdx)
				assert.Empty(t, c.idx)
			}
		})
	}
}

func Test_client_add_missingIndexedKeyProducesEmptyField(t *testing.T) {
	c := newGlobalClient(v1.KindDashboard, []string{"metadata.name", "spec.unknown.field"})

	raw := json.RawMessage(`{
		"kind": "Dashboard",
		"metadata": {
			"name": "mydashboard",
			"project": "myproject"
		},
		"spec": {}
	}`)

	err := c.add(raw)
	require.NoError(t, err)

	entry := c.projectIdx["myproject"]["mydashboard"]
	assert.Equal(t, []string{"mydashboard", ""}, entry.fields)
}

func Test_client_add_multipleProjectsAreIndexedSeparately(t *testing.T) {
	c := newGlobalClient(v1.KindDashboard, []string{"metadata.name"})

	rawA := json.RawMessage(`{
		"kind": "Dashboard",
		"metadata": {"name": "dashboard-a", "project": "project-a"},
		"spec": {}
	}`)
	rawB := json.RawMessage(`{
		"kind": "Dashboard",
		"metadata": {"name": "dashboard-b", "project": "project-b"},
		"spec": {}
	}`)

	require.NoError(t, c.add(rawA))
	require.NoError(t, c.add(rawB))

	require.Contains(t, c.projectIdx, "project-a")
	require.Contains(t, c.projectIdx, "project-b")
	assert.Contains(t, c.projectIdx["project-a"], "dashboard-a")
	assert.Contains(t, c.projectIdx["project-b"], "dashboard-b")
}
