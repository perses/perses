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
	"fmt"
	"io"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
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
						fields: []indexedField{
							{key: "metadata.name", path: []string{"metadata", "name"}, value: "mydashboard"},
							{key: "metadata.project", path: []string{"metadata", "project"}, value: "myproject"},
						},
						matcher: &matcher{},
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
						fields: []indexedField{
							{key: "metadata.name", path: []string{"metadata", "name"}, value: "mydashboard"},
							{key: "metadata.project", path: []string{"metadata", "project"}, value: "myproject"},
							{key: "spec.display.name", path: []string{"spec", "display", "name"}, value: "My Fancy Dashboard"},
						},
						matcher: &matcher{},
					},
				},
			},
		},
		{
			title: "add dashboard with missing indexed key",
			raw: json.RawMessage(`{
		"kind": "Dashboard",
		"metadata": {
			"name": "mydashboard",
			"project": "myproject"
		},
		"spec": {}
	}`),
			indexedKeys: []string{"metadata.name", "spec.unknown.field"},
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
						fields: []indexedField{
							{key: "metadata.name", path: []string{"metadata", "name"}, value: "mydashboard"},
						},
						matcher: &matcher{},
					},
				},
			},
		},
		{
			title: "add dashboard with array as indexed key",
			raw: json.RawMessage(`{
		"kind": "Dashboard",
		"metadata": {
			"name": "mydashboard",
			"project": "myproject"
		},
		"spec": {
          "panels": {
            "MyPanel": {
              "kind": "Panel",
              "spec": {
                "display": {
                  "name": "simple line chart"
                },
                "plugin": {
                  "kind": "TimeSeriesChart",
                  "spec": {
                    "showLegend": false,
                    "lines": [
                      "up"
                    ]
                  }
                }
              }
            },
            "MyOtherPanel": {
              "kind": "Panel",
              "spec": {
                "display": {
                  "name": "another line chart"
                },
                "plugin": {
                  "kind": "TimeSeriesChart",
                  "spec": {
                    "showLegend": false,
                    "lines": [
                      "up"
                    ]
                  }
                }
              }
            }
          }
        }
	}`),
			indexedKeys: []string{"spec.panels.@dig:display.name"},
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
						fields: []indexedField{
							{key: "spec.panels.@dig:display.name", path: []string{"spec", "panels", "MyPanel", "spec", "display", "name"}, value: "simple line chart"},
							{key: "spec.panels.@dig:display.name", path: []string{"spec", "panels", "MyOtherPanel", "spec", "display", "name"}, value: "another line chart"},
						},
						matcher: &matcher{},
					},
				},
			},
		},
	}
	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: tc.indexedKeys}}, newDisabledAuthz(t), nil).(*client)
			err := c.add(tc.raw)
			require.NoError(t, err)
			assert.Equal(t, tc.expectedProjectIdx, c.dashboards.idx)
		})
	}
}

func Test_client_add_multipleProjectsAreIndexedSeparately(t *testing.T) {
	c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: []string{"metadata.name"}}}, newDisabledAuthz(t), nil).(*client)

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

// wildcardAuthorization returns the wildcard mixed with a real project, as k8s authz does for a user
// with all-project access alongside specific projects.
type wildcardAuthorization struct {
	authorization.Authorization
}

func (*wildcardAuthorization) IsEnabled() bool {
	return true
}

func (*wildcardAuthorization) HasPermission(_ echo.Context, _ role.Action, _ string, _ role.Scope) bool {
	return true
}

func (*wildcardAuthorization) GetUserProjects(_ echo.Context, _ role.Action, _ role.Scope) ([]string, error) {
	return []string{v1.WildcardProject, "project-a"}, nil
}

// TestClientSearch_wildcardAmongAuthorizedProjects ensures a wildcard mixed with a real project grants
// global access (search spans all projects) instead of being limited to the explicitly listed project.
func TestClientSearch_wildcardAmongAuthorizedProjects(t *testing.T) {
	c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: []string{"metadata.name"}}}, &wildcardAuthorization{}, nil).(*client)

	docs := []json.RawMessage{
		json.RawMessage(`{"kind": "Dashboard", "metadata": {"name": "node-exporter", "project": "project-a"}, "spec": {}}`),
		json.RawMessage(`{"kind": "Dashboard", "metadata": {"name": "node-cpu-usage", "project": "project-b"}, "spec": {}}`),
	}
	for _, d := range docs {
		require.NoError(t, c.add(d))
	}

	// An empty project triggers the GetUserProjects path.
	results, err := c.Search(nil, v1.KindDashboard, "", "node")
	require.NoError(t, err)

	var names []string
	for _, r := range results {
		names = append(names, r.Original)
	}
	assert.ElementsMatch(t, []string{"node-exporter", "node-cpu-usage"}, names)
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
	c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: []string{"metadata.name"}}}, newDisabledAuthz(t), nil).(*client)

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
			results, err := c.Search(nil, tc.kind, tc.project, tc.text)
			require.NoError(t, err)
			var names []string
			for _, r := range results {
				names = append(names, r.Original)
			}
			assert.ElementsMatch(t, tc.expectedNames, names)
		})
	}
}

func TestClientSearch_returnsKeyAndPathOfMatchingField(t *testing.T) {
	testsCases := []struct {
		title            string
		text             string
		expectedOriginal string
		expectedKey      string
		expectedPath     []string
	}{
		{
			title:            "match on the display name",
			text:             "fancy",
			expectedOriginal: "My Fancy Dashboard",
			expectedKey:      "spec.display.name",
			expectedPath:     []string{"spec", "display", "name"},
		},
		{
			title:            "match on the name",
			text:             "mydash",
			expectedOriginal: "mydashboard",
			expectedKey:      "metadata.name",
			expectedPath:     []string{"metadata", "name"},
		},
		{
			title:            "match on a tag",
			text:             "production",
			expectedOriginal: "production",
			expectedKey:      "metadata.tags",
			expectedPath:     []string{"metadata", "tags", "1"},
		},
	}
	c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: []string{"metadata.name", "spec.display.name", "metadata.tags"}}}, newDisabledAuthz(t), nil).(*client)
	require.NoError(t, c.add(json.RawMessage(`{
		"kind": "Dashboard",
		"metadata": {"name": "mydashboard", "project": "myproject", "tags": ["kubernetes", "production"]},
		"spec": {"display": {"name": "My Fancy Dashboard"}}
	}`)))

	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			results, err := c.Search(nil, v1.KindDashboard, "", tc.text)
			require.NoError(t, err)
			require.Len(t, results, 1)
			assert.Equal(t, tc.expectedOriginal, results[0].Original)
			assert.Equal(t, tc.expectedKey, results[0].Key)
			assert.Equal(t, tc.expectedPath, results[0].Path)
		})
	}
}

func TestRefreshDropsDashboardsMissingFromDatabase(t *testing.T) {
	c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: []string{"metadata.name"}}}, newDisabledAuthz(t), nil).(*client)
	keep := dashboardRaw("keep")
	gone := dashboardRaw("gone")
	require.NoError(t, c.add(keep))
	require.NoError(t, c.add(gone))
	c.dao = &streamDAO{docs: []json.RawMessage{keep}}

	require.NoError(t, c.Refresh())

	assert.ElementsMatch(t, []string{"keep"}, dashboardNames(t, c, "demo"))
}

func TestRefreshClearsIndexWhenDatabaseIsEmpty(t *testing.T) {
	c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: []string{"metadata.name"}}}, newDisabledAuthz(t), nil).(*client)
	require.NoError(t, c.add(dashboardRaw("gone")))
	c.dao = &streamDAO{}

	require.NoError(t, c.Refresh())

	assert.Empty(t, dashboardNames(t, c, "demo"))
}

func TestRefreshKeepsIndexWhenStreamFails(t *testing.T) {
	c := New(config.Search{IndexKeys: config.IndexKeys{Dashboard: []string{"metadata.name"}}}, newDisabledAuthz(t), nil).(*client)
	require.NoError(t, c.add(dashboardRaw("keep")))
	require.NoError(t, c.add(dashboardRaw("also")))
	c.dao = &streamDAO{
		docs: []json.RawMessage{dashboardRaw("partial")},
		err:  fmt.Errorf("database unavailable"),
	}

	err := c.Refresh()

	require.EqualError(t, err, "database unavailable")
	assert.ElementsMatch(t, []string{"keep", "also"}, dashboardNames(t, c, "demo"))
}

func dashboardRaw(name string) json.RawMessage {
	return json.RawMessage(fmt.Sprintf(`{"kind":"Dashboard","metadata":{"name":%q,"project":"demo"},"spec":{}}`, name))
}

func dashboardNames(t *testing.T, c *client, project string) []string {
	t.Helper()
	results, err := c.List(nil, v1.KindDashboard, project)
	require.NoError(t, err)
	names := make([]string, 0, len(results))
	for _, result := range results {
		names = append(names, result.Metadata.GetName())
	}
	return names
}

type streamDAO struct {
	docs []json.RawMessage
	err  error
}

func (d *streamDAO) StreamRaw(_ databaseModel.Query, ch chan<- json.RawMessage) error {
	defer close(ch)
	for _, doc := range d.docs {
		ch <- doc
	}
	return d.err
}

func (d *streamDAO) Close() error                                          { return nil }
func (d *streamDAO) Init() error                                           { return nil }
func (d *streamDAO) IsCaseSensitive() bool                                 { return false }
func (d *streamDAO) Create(modelAPI.Entity) error                          { return nil }
func (d *streamDAO) Upsert(modelAPI.Entity) error                          { return nil }
func (d *streamDAO) Get(v1.Kind, modelAPI.Metadata, modelAPI.Entity) error { return nil }
func (d *streamDAO) Query(databaseModel.Query, any) error                  { return nil }
func (d *streamDAO) RawQuery(databaseModel.Query) ([]json.RawMessage, error) {
	return nil, nil
}
func (d *streamDAO) RawMetadataQuery(databaseModel.Query, v1.Kind) ([]json.RawMessage, error) {
	return nil, nil
}
func (d *streamDAO) Delete(v1.Kind, modelAPI.Metadata) error        { return nil }
func (d *streamDAO) DeleteByQuery(databaseModel.Query) error        { return nil }
func (d *streamDAO) HealthCheck() bool                              { return true }
func (d *streamDAO) GetLatestUpdateTime([]v1.Kind) (*string, error) { return nil, nil }

var (
	_ databaseModel.DAO = (*streamDAO)(nil)
	_ io.Closer         = (*streamDAO)(nil)
)
