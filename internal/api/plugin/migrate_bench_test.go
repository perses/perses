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

package plugin

import (
	"encoding/json"
	"path/filepath"
	"testing"

	"github.com/perses/perses/internal/api/plugin/migrate/grafana"
	testUtils "github.com/perses/perses/internal/test"
	"github.com/sirupsen/logrus"
)

// This file contains benchmarks for the Grafana dashboard migration (Migration.Migrate), based on the dashboards of
// migrate/testdata/dashboards and the test plugins of migrate/testdata/plugins. The migration has twice become much
// slower or much more memory hungry after a release without anyone noticing before production use (#2039, #3962),
// and these benchmarks are meant to catch that kind of regression.
//
// Run them with:
//   go test -run '^$' -bench Migrate -benchmem ./internal/api/plugin/
//
// A pull request that can affect the performance of the migration should include a benchstat comparison of these
// benchmarks between its base and its branch: see the "Grafana migration changes" section of CONTRIBUTING.md.
// Keep the list of dashboards below stable, otherwise the comparison with the base is not possible.

// migrateBenchDashboards are the Grafana dashboards of migrate/testdata/dashboards used by the benchmarks. They cover
// the main parts of the migration: panels, queries, variables, rows (including repeated rows), repeated panels,
// annotations, and the Grafana v2 dashboard layout.
var migrateBenchDashboards = []struct {
	name string
	file string
}{
	{name: "basic", file: "basic_grafana_dashboard.json"},
	{name: "row-repeat", file: "row_repeat_grafana_dashboard.json"},
	{name: "panel-repeat", file: "panel_repeat_grafana_dashboard.json"},
	{name: "annotations", file: "annotations_grafana_dashboard.json"},
	{name: "grafana-v2", file: "grafana_v2_grafana_dashboard.json"},
	{name: "grafana-v2-repeated-rows", file: "grafana_v2_repeated_rows_grafana_dashboard.json"},
}

// silenceMigrateBenchLogs hides the warnings logged by the migration, for example for the queries that the test
// plugins don't handle, so that they don't flood the benchmark output.
func silenceMigrateBenchLogs(b *testing.B) {
	b.Helper()
	level := logrus.GetLevel()
	logrus.SetLevel(logrus.ErrorLevel)
	b.Cleanup(func() { logrus.SetLevel(level) })
}

func loadMigrateBenchDashboard(b *testing.B, file string) *grafana.Dashboard {
	b.Helper()
	input := testUtils.ReadFile(filepath.Join("migrate", testDataFolder, "dashboards", file))
	grafanaDashboard := &grafana.Dashboard{}
	if err := json.Unmarshal(input, grafanaDashboard); err != nil {
		b.Fatal(err)
	}
	return grafanaDashboard
}

// BenchmarkMigrate measures the migration of a single Grafana dashboard into a Perses dashboard.
func BenchmarkMigrate(b *testing.B) {
	silenceMigrateBenchLogs(b)
	pl := loadDefaultTestPlugins()
	for _, d := range migrateBenchDashboards {
		grafanaDashboard := loadMigrateBenchDashboard(b, d.file)
		b.Run(d.name, func(b *testing.B) {
			b.ReportAllocs()
			for b.Loop() {
				if _, err := pl.Migration().Migrate(grafanaDashboard, false); err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

// BenchmarkMigrateAll measures the migration of all the dashboards of migrateBenchDashboards one after the other with
// the same plugins, like a bulk migration does.
func BenchmarkMigrateAll(b *testing.B) {
	silenceMigrateBenchLogs(b)
	pl := loadDefaultTestPlugins()
	grafanaDashboards := make([]*grafana.Dashboard, 0, len(migrateBenchDashboards))
	for _, d := range migrateBenchDashboards {
		grafanaDashboards = append(grafanaDashboards, loadMigrateBenchDashboard(b, d.file))
	}
	b.ReportAllocs()
	for b.Loop() {
		for _, grafanaDashboard := range grafanaDashboards {
			if _, err := pl.Migration().Migrate(grafanaDashboard, false); err != nil {
				b.Fatal(err)
			}
		}
	}
}
