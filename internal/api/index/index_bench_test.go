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
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/perses/spec/go/common"
	dashboardSpec "github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/plugin"
)

// This file contains benchmarks for the search index of the dashboards, based on generated datasets of realistic
// dashboards (see newBenchDataset). They cover:
//   - the update of a dashboard in the index (Add),
//   - the search through all the dashboards (Search), with several kinds of queries, and under concurrent requests,
//   - the listing of the dashboards (List), with and without authorization,
//   - the rebuild of the whole index from the database (Refresh).
// The matching of a query against a single indexed field is benchmarked in matcher_bench_test.go.
//
// Run them with:
//   go test -run '^$' -bench . -benchmem ./internal/api/index/
//
// A pull request that can affect the performance of the search index must include a benchstat comparison of these
// benchmarks between its base and its branch: see the "Search index changes" section of CONTRIBUTING.md.
// Keep the existing benchmarks and their datasets stable, otherwise the comparison with the base is not possible.

// BenchmarkClientAdd measures the update of a dashboard in the index, done each time a dashboard is created or updated
// through the API. It includes the marshalling of the dashboard, so it grows with the number of panels.
func BenchmarkClientAdd(b *testing.B) {
	size := benchDatasetSizes[1]
	b.Run(size.String(), func(b *testing.B) {
		docs := newBenchDataset(b, size)
		for _, keys := range benchIndexKeys {
			b.Run("keys="+keys.name, func(b *testing.B) {
				c := newBenchClient(b, keys.extraKeys, newDisabledAuthz(b), docs)
				for _, panelCount := range []int{benchPanelCount, 100} {
					b.Run(fmt.Sprintf("panels=%d", panelCount), func(b *testing.B) {
						dashboard := newBenchDashboard(benchProjectName(0), 0, panelCount)
						project, name := dashboard.Metadata.Project, dashboard.Metadata.Name
						if _, ok := c.dashboards.idx[project][name]; !ok {
							b.Fatalf("dashboard %s/%s is not in the dataset", project, name)
						}
						if err := c.Add(dashboard); err != nil {
							b.Fatal(err)
						}
						// The default keys index the name and the display name of the dashboard.
						expectedFields := 2 + keys.fieldsPerPanel*panelCount
						if fields := c.dashboards.idx[project][name].fields; len(fields) != expectedFields {
							b.Fatalf("%d fields indexed, expected %d", len(fields), expectedFields)
						}
						b.ReportAllocs()
						for b.Loop() {
							if err := c.Add(dashboard); err != nil {
								b.Fatal(err)
							}
						}
					})
				}
			})
		}
	})
}

// BenchmarkClientSearch measures a search through all the dashboards, i.e. without project, by a user who can read all
// of them. The query is matched against the indexed fields of every dashboard, until one of them matches.
func BenchmarkClientSearch(b *testing.B) {
	queries := []struct {
		name        string
		query       string
		expectMatch bool
	}{
		// It is the display name of 5% of the dashboards.
		{name: "exact", query: "Node Exporter Full", expectMatch: true},
		// It is in the name and the display name of 25% of the dashboards.
		{name: "word", query: "kubernetes", expectMatch: true},
		// Its characters are scattered in the display name of 10% of the dashboards.
		{name: "fuzzy", query: "kube pod", expectMatch: true},
		{name: "no-match", query: "windows"},
	}
	for _, size := range benchDatasetSizes {
		b.Run(size.String(), func(b *testing.B) {
			docs := newBenchDataset(b, size)
			for _, keys := range benchIndexKeys {
				b.Run("keys="+keys.name, func(b *testing.B) {
					c := newBenchClient(b, keys.extraKeys, newDisabledAuthz(b), docs)
					for _, q := range queries {
						b.Run("query="+q.name, func(b *testing.B) {
							results, err := c.Search(nil, v1.KindDashboard, "", q.query)
							if err != nil {
								b.Fatal(err)
							}
							if (len(results) > 0) != q.expectMatch {
								b.Fatalf("%d dashboards match %q, expected a match: %t", len(results), q.query, q.expectMatch)
							}
							b.ReportAllocs()
							for b.Loop() {
								if _, err := c.Search(nil, v1.KindDashboard, "", q.query); err != nil {
									b.Fatal(err)
								}
							}
							b.ReportMetric(float64(len(results)), "results/op")
						})
					}
				})
			}
		})
	}
}

// BenchmarkClientSearchParallel measures the search under concurrent requests, which share the read lock of the index.
func BenchmarkClientSearchParallel(b *testing.B) {
	for _, size := range benchDatasetSizes {
		b.Run(size.String(), func(b *testing.B) {
			// RunParallel calls the benchmark function several times: the index is built once, outside of it.
			c := newBenchClient(b, nil, newDisabledAuthz(b), newBenchDataset(b, size))
			b.Run("keys=default/query=word", func(b *testing.B) {
				b.ReportAllocs()
				b.RunParallel(func(pb *testing.PB) {
					for pb.Next() {
						if _, err := c.Search(nil, v1.KindDashboard, "", "kubernetes"); err != nil {
							b.Error(err)
							return
						}
					}
				})
			})
		})
	}
}

// BenchmarkClientList measures the listing of the dashboards, i.e. a search without query. The UI uses it to display
// the dashboards of a project. The authorization is a stub: its cost is measured by the benchmarks of the native
// authorization.
func BenchmarkClientList(b *testing.B) {
	const memberProjectCount = 5
	memberProjects := make([]string, 0, memberProjectCount)
	for p := range memberProjectCount {
		memberProjects = append(memberProjects, benchProjectName(p))
	}
	scenarios := []struct {
		name    string
		authz   authorization.Authorization
		project string
		// listedProjects is the number of projects whose dashboards are listed, 0 meaning all the projects.
		listedProjects int
	}{
		{
			name:  "authz=disabled/project=all",
			authz: newDisabledAuthz(b),
		},
		{
			// A user with the read permission on all the projects, like an administrator.
			name:  "authz=wildcard/project=all",
			authz: &benchAuthorization{projects: []string{v1.WildcardProject}},
		},
		{
			// A user with the read permission on 5 projects.
			name:           "authz=5-projects/project=all",
			authz:          &benchAuthorization{projects: memberProjects},
			listedProjects: memberProjectCount,
		},
		{
			name:           "authz=5-projects/project=one",
			authz:          &benchAuthorization{projects: memberProjects},
			project:        memberProjects[0],
			listedProjects: 1,
		},
	}
	for _, size := range benchDatasetSizes {
		b.Run(size.String(), func(b *testing.B) {
			docs := newBenchDataset(b, size)
			for _, sc := range scenarios {
				b.Run(sc.name, func(b *testing.B) {
					c := newBenchClient(b, nil, sc.authz, docs)
					expectedResults := size.dashboardCount()
					if sc.listedProjects > 0 {
						expectedResults = sc.listedProjects * size.dashboardsPerProject
					}
					results, err := c.List(nil, v1.KindDashboard, sc.project)
					if err != nil {
						b.Fatal(err)
					}
					if len(results) != expectedResults {
						b.Fatalf("%d dashboards listed, expected %d", len(results), expectedResults)
					}
					b.ReportAllocs()
					for b.Loop() {
						if _, err := c.List(nil, v1.KindDashboard, sc.project); err != nil {
							b.Fatal(err)
						}
					}
					b.ReportMetric(float64(len(results)), "results/op")
				})
			}
		})
	}
}

// BenchmarkClientRefresh measures the rebuild of the whole index from the database content, done at startup and each
// time the database content changed (see internal/api/refresh).
func BenchmarkClientRefresh(b *testing.B) {
	for _, size := range benchDatasetSizes {
		b.Run(size.String(), func(b *testing.B) {
			docs := newBenchDataset(b, size)
			for _, keys := range benchIndexKeys {
				b.Run("keys="+keys.name, func(b *testing.B) {
					c := newBenchClient(b, keys.extraKeys, newDisabledAuthz(b), nil)
					c.dao = &streamDAO{docs: docs}
					if err := c.Refresh(); err != nil {
						b.Fatal(err)
					}
					if count := indexedDashboardCount(c); count != len(docs) {
						b.Fatalf("%d dashboards indexed, expected %d", count, len(docs))
					}
					b.ReportAllocs()
					for b.Loop() {
						if err := c.Refresh(); err != nil {
							b.Fatal(err)
						}
					}
				})
			}
		})
	}
}

// benchPanelCount is the number of panels of the dashboards of the datasets.
const benchPanelCount = 10

// benchTime is the creation and update time of the generated dashboards, fixed to keep the datasets stable.
var benchTime = time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC)

// benchDashboardTitles are the display names of the generated dashboards, inspired by commonly used dashboards.
// The queries of BenchmarkClientSearch depend on them.
var benchDashboardTitles = []string{
	"Node Exporter Full",
	"Kubernetes / API Server",
	"Kubernetes / Compute Resources / Cluster",
	"Kubernetes / Compute Resources / Namespace (Pods)",
	"Kubernetes / Networking / Pod",
	"Kubernetes / Persistent Volumes",
	"Prometheus / Overview",
	"Alertmanager / Overview",
	"CoreDNS",
	"etcd",
	"Thanos / Query",
	"Loki / Operational",
	"Tempo / Reads",
	"Blackbox Exporter",
	"MySQL Overview",
	"PostgreSQL Database",
	"Redis Dashboard",
	"Kafka Overview",
	"NGINX Ingress Controller",
	"Checkout Service SLOs",
}

// benchPanelTitles are the display names of the panels of the generated dashboards.
var benchPanelTitles = []string{
	"CPU Usage",
	"Memory Usage",
	"Disk I/O",
	"Network Traffic",
	"Request Rate",
	"Error Rate",
	"Latency (p99)",
	"Uptime",
	"Goroutines",
	"Open File Descriptors",
}

// benchDatasetSize is the size of a dataset: projectCount projects, with dashboardsPerProject dashboards each.
type benchDatasetSize struct {
	projectCount         int
	dashboardsPerProject int
}

func (s benchDatasetSize) dashboardCount() int {
	return s.projectCount * s.dashboardsPerProject
}

func (s benchDatasetSize) String() string {
	return fmt.Sprintf("projects=%d/dashboards=%d", s.projectCount, s.dashboardCount())
}

var benchDatasetSizes = []benchDatasetSize{
	{projectCount: 10, dashboardsPerProject: 10},
	{projectCount: 100, dashboardsPerProject: 10},
	{projectCount: 1000, dashboardsPerProject: 10},
}

// benchIndexKeys are the configurations of the indexed keys used by the benchmarks: the default one, and the default
// one plus the display names of the panels, as suggested by the documentation, which multiplies the indexed fields.
var benchIndexKeys = []struct {
	name      string
	extraKeys []string
	// fieldsPerPanel is the number of fields indexed for each panel of a dashboard.
	fieldsPerPanel int
}{
	{name: "default"},
	{name: "with-panels", extraKeys: []string{"spec.panels.@dig:display.name"}, fieldsPerPanel: 1},
}

func benchProjectName(p int) string {
	return fmt.Sprintf("project%d", p)
}

// benchDashboardName returns the name generated by the UI for a dashboard with the given display name.
func benchDashboardName(displayName string) string {
	return strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '.' || r == '-' {
			return r
		}
		return '_'
	}, displayName)
}

// newBenchDashboard returns a dashboard of the given project, named after the i-th title of benchDashboardTitles
// (modulo their number), with panelCount panels, each with a Prometheus query, displayed in a grid.
func newBenchDashboard(project string, i, panelCount int) *v1.Dashboard {
	title := benchDashboardTitles[i%len(benchDashboardTitles)]
	panels := make(map[string]*dashboardSpec.Panel, panelCount)
	items := make([]dashboardSpec.GridItem, 0, panelCount)
	for j := range panelCount {
		key := fmt.Sprintf("panel%d", j)
		panels[key] = &dashboardSpec.Panel{
			Kind: "Panel",
			Spec: dashboardSpec.PanelSpec{
				Display: &dashboardSpec.PanelDisplay{Name: benchPanelTitles[j%len(benchPanelTitles)]},
				Plugin:  plugin.Plugin{Kind: "TimeSeriesChart", Spec: map[string]any{}},
				Queries: []dashboardSpec.Query{
					{
						Kind: "TimeSeriesQuery",
						Spec: dashboardSpec.QuerySpec{
							Plugin: plugin.Plugin{
								Kind: "PrometheusTimeSeriesQuery",
								Spec: map[string]any{
									"query": fmt.Sprintf(`sum by (instance) (rate(http_requests_total{job="service-%d"}[5m]))`, j),
								},
							},
						},
					},
				},
			},
		}
		items = append(items, dashboardSpec.GridItem{
			X:       (j % 2) * 12,
			Y:       (j / 2) * 8,
			Width:   12,
			Height:  8,
			Content: &common.JSONRef{Ref: "#/spec/panels/" + key},
		})
	}
	return &v1.Dashboard{
		Kind: v1.KindDashboard,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name:      benchDashboardName(title),
				CreatedAt: benchTime,
				UpdatedAt: benchTime,
				Version:   1,
			},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{Project: project},
		},
		Spec: dashboardSpec.Spec{
			Display: &common.Display{Name: title},
			Panels:  panels,
			Layouts: []dashboardSpec.Layout{
				{Kind: dashboardSpec.KindGridLayout, Spec: &dashboardSpec.GridLayoutSpec{Items: items}},
			},
			Duration: "1h",
		},
	}
}

// newBenchDataset returns the dashboards of a dataset, marshalled as in the database.
// The i-th dashboard is in the project i / dashboardsPerProject and is named after the i-th title of
// benchDashboardTitles (modulo their number), so each title is used by the same number of dashboards.
func newBenchDataset(tb testing.TB, size benchDatasetSize) []json.RawMessage {
	tb.Helper()
	if size.dashboardsPerProject > len(benchDashboardTitles) {
		tb.Fatalf("a project can't have more than %d dashboards, otherwise their names are not unique", len(benchDashboardTitles))
	}
	docs := make([]json.RawMessage, 0, size.dashboardCount())
	for i := range size.dashboardCount() {
		raw, err := json.Marshal(newBenchDashboard(benchProjectName(i/size.dashboardsPerProject), i, benchPanelCount))
		if err != nil {
			tb.Fatal(err)
		}
		docs = append(docs, raw)
	}
	return docs
}

// newBenchClient returns a client indexing the given dashboards, with the default indexed keys plus the extra ones.
func newBenchClient(tb testing.TB, extraKeys []string, authz authorization.Authorization, docs []json.RawMessage) *client {
	tb.Helper()
	conf := config.Search{}
	if err := conf.Verify(); err != nil {
		tb.Fatal(err)
	}
	conf.IndexKeys.Dashboard = append(conf.IndexKeys.Dashboard, extraKeys...)
	c := New(conf, authz, nil).(*client)
	for _, doc := range docs {
		if err := c.add(doc); err != nil {
			tb.Fatal(err)
		}
	}
	if count := indexedDashboardCount(c); count != len(docs) {
		tb.Fatalf("%d dashboards indexed, expected %d", count, len(docs))
	}
	return c
}

func indexedDashboardCount(c *client) int {
	c.dashboards.mutex.RLock()
	defer c.dashboards.mutex.RUnlock()
	count := 0
	for _, projectIdx := range c.dashboards.idx {
		count += len(projectIdx)
	}
	return count
}

// benchAuthorization is an enabled authorization granting the read permission on the given projects only.
type benchAuthorization struct {
	authorization.Authorization
	projects []string
}

func (*benchAuthorization) IsEnabled() bool {
	return true
}

func (a *benchAuthorization) HasPermission(_ *echo.Context, _ role.Action, project string, _ role.Scope) bool {
	return slices.Contains(a.projects, v1.WildcardProject) || slices.Contains(a.projects, project)
}

func (a *benchAuthorization) GetUserProjects(_ *echo.Context, _ role.Action, _ role.Scope) ([]string, error) {
	return a.projects, nil
}
