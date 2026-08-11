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

	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newDisabledAuthz returns an authorization.Authorization implementation with authorization disabled.
// When authorization is disabled, the echo.Context parameter is never used by the implementation,
// so tests can safely pass nil as the context when calling functions that require it.
func newDisabledAuthz(t *testing.T) authorization.Authorization {
	t.Helper()
	authz, err := authorization.New(nil, nil, nil, nil, nil, config.Config{})
	require.NoError(t, err)
	require.False(t, authz.IsEnabled())
	return authz
}

func TestClientAdd(t *testing.T) {
	testsCases := []struct {
		title              string
		raw                json.RawMessage
		indexedKeys        []string
		expectedProjectIdx map[string]map[string]index[*v1.ProjectMetadata]
	}{
		{
			title: "add project resource",
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
						matcher:     &matcher{},
					},
				},
			},
		},
		{
			title: "add dashboard with display name",
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
						matcher:     &matcher{},
					},
				},
			},
		},
	}
	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			c := newClient(tc.indexedKeys, newDisabledAuthz(t))
			err := c.add(tc.raw)
			require.NoError(t, err)
			assert.Equal(t, tc.expectedProjectIdx, c.dashboards.idx)
		})
	}
}

func Test_client_add_missingIndexedKeyProducesEmptyField(t *testing.T) {
	c := newClient([]string{"metadata.name", "spec.unknown.field"}, newDisabledAuthz(t))

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

	entry := c.dashboards.idx["myproject"]["mydashboard"]
	assert.Equal(t, []string{"mydashboard", ""}, entry.fields)
}

func Test_client_add_multipleProjectsAreIndexedSeparately(t *testing.T) {
	c := newClient([]string{"metadata.name"}, newDisabledAuthz(t))

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

	require.Contains(t, c.dashboards.idx, "project-a")
	require.Contains(t, c.dashboards.idx, "project-b")
	assert.Contains(t, c.dashboards.idx["project-a"], "dashboard-a")
	assert.Contains(t, c.dashboards.idx["project-b"], "dashboard-b")
}

// TestClientSearch_authorizationDisabled tests the client.search function when authorization is disabled.
// When it is disabled, the ctx (echo.Context) is not used at all by the authorization service,
// so we can safely pass nil as the context.
func TestClientSearch_authorizationDisabled(t *testing.T) {
	testsCases := []struct {
		title         string
		kind          v1.Kind
		project       string
		text          string
		expectedNames []string
	}{
		{
			title:         "search across all projects",
			kind:          v1.KindDashboard,
			project:       "",
			text:          "node",
			expectedNames: []string{"node-exporter", "node-cpu-usage"},
		},
		{
			title:         "search filtered by project",
			kind:          v1.KindDashboard,
			project:       "project-a",
			text:          "node",
			expectedNames: []string{"node-exporter"},
		},
		{
			title:         "search with no match returns empty slice",
			kind:          v1.KindDashboard,
			project:       "",
			text:          "doesnotexist",
			expectedNames: nil,
		},
		{
			title:         "search with unsupported kind returns empty slice",
			kind:          v1.KindProject,
			project:       "",
			text:          "node",
			expectedNames: nil,
		},
	}
	c := newClient([]string{"metadata.name"}, newDisabledAuthz(t))

	docs := []json.RawMessage{
		json.RawMessage(`{"kind": "Dashboard", "metadata": {"name": "node-exporter", "project": "project-a"}, "spec": {}}`),
		json.RawMessage(`{"kind": "Dashboard", "metadata": {"name": "kube-state-metrics", "project": "project-a"}, "spec": {}}`),
		json.RawMessage(`{"kind": "Dashboard", "metadata": {"name": "node-cpu-usage", "project": "project-b"}, "spec": {}}`),
	}
	for _, d := range docs {
		require.NoError(t, c.add(d))
	}

	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			results, err := c.search(nil, tc.kind, tc.project, tc.text)
			require.NoError(t, err)
			var names []string
			for _, r := range results {
				names = append(names, r.Original)
			}
			assert.ElementsMatch(t, tc.expectedNames, names)
		})
	}
}
