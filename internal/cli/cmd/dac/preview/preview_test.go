// Copyright 2024 The Perses Authors
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

package preview

import (
	"testing"

	"github.com/perses/perses/internal/cli/config"
	cmdTest "github.com/perses/perses/internal/cli/test"
	fakeapi "github.com/perses/perses/pkg/client/fake/api"
)

func TestPreviewCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any API",
		},
		{
			Title:           "no dashboard",
			Args:            []string{},
			APIClient:       fakeapi.New(),
			Config:          config.Config{Dac: config.Dac{OutputFolder: "./emptybuild"}},
			IsErrorExpected: true,
			ExpectedMessage: "no dashboard found to create a preview",
		},
		{
			Title:           "preview with no prefix",
			Args:            []string{},
			APIClient:       fakeapi.New(),
			Config:          config.Config{Dac: config.Dac{OutputFolder: "../../../../../dev/data/9-dashboard.json"}},
			IsErrorExpected: false,
			ExpectedMessage: `- project: perses
  dashboard: Demo
  preview: http://localhost:8080/projects/perses/ephemeraldashboards/Demo
- project: perses
  dashboard: Benchmark
  preview: http://localhost:8080/projects/perses/ephemeraldashboards/Benchmark
- project: testing
  dashboard: PanelGroups
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/PanelGroups
- project: testing
  dashboard: Panels
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/Panels
- project: testing
  dashboard: Variables
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/Variables
- project: testing
  dashboard: MarkdownPanel
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/MarkdownPanel
- project: testing
  dashboard: TimeSeriesChartPanel
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/TimeSeriesChartPanel
- project: testing
  dashboard: GaugeChartPanel
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/GaugeChartPanel
- project: testing
  dashboard: StatChartPanel
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/StatChartPanel
- project: testing
  dashboard: DuplicatePanels
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/DuplicatePanels
- project: testing
  dashboard: EditJson
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/EditJson
- project: testing
  dashboard: Defaults
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/Defaults
- project: testing
  dashboard: TimeSeriesChartLegends
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/TimeSeriesChartLegends
- project: testing
  dashboard: table
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/table
- project: perses
  dashboard: NodeExporter
  preview: http://localhost:8080/projects/perses/ephemeraldashboards/NodeExporter
- project: testing
  dashboard: tracing
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/tracing

`,
		},
		{
			Title:           "preview with prefix",
			Args:            []string{"--prefix", "pr-1664"},
			APIClient:       fakeapi.New(),
			Config:          config.Config{Dac: config.Dac{OutputFolder: "../../../../../dev/data/9-dashboard.json"}},
			IsErrorExpected: false,
			ExpectedMessage: `- project: perses
  dashboard: Demo
  preview: http://localhost:8080/projects/perses/ephemeraldashboards/pr-1664-Demo
- project: perses
  dashboard: Benchmark
  preview: http://localhost:8080/projects/perses/ephemeraldashboards/pr-1664-Benchmark
- project: testing
  dashboard: PanelGroups
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-PanelGroups
- project: testing
  dashboard: Panels
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-Panels
- project: testing
  dashboard: Variables
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-Variables
- project: testing
  dashboard: MarkdownPanel
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-MarkdownPanel
- project: testing
  dashboard: TimeSeriesChartPanel
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-TimeSeriesChartPanel
- project: testing
  dashboard: GaugeChartPanel
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-GaugeChartPanel
- project: testing
  dashboard: StatChartPanel
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-StatChartPanel
- project: testing
  dashboard: DuplicatePanels
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-DuplicatePanels
- project: testing
  dashboard: EditJson
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-EditJson
- project: testing
  dashboard: Defaults
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-Defaults
- project: testing
  dashboard: TimeSeriesChartLegends
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-TimeSeriesChartLegends
- project: testing
  dashboard: table
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-table
- project: perses
  dashboard: NodeExporter
  preview: http://localhost:8080/projects/perses/ephemeraldashboards/pr-1664-NodeExporter
- project: testing
  dashboard: tracing
  preview: http://localhost:8080/projects/testing/ephemeraldashboards/pr-1664-tracing

`,
		},
		{
			Title:           "preview in json",
			Args:            []string{"--output", "json"},
			APIClient:       fakeapi.New(),
			Config:          config.Config{Dac: config.Dac{OutputFolder: "../../../../../dev/data/9-dashboard.json"}},
			IsErrorExpected: false,
			ExpectedMessage: `[{"project":"perses","dashboard":"Demo","preview":"http://localhost:8080/projects/perses/ephemeraldashboards/Demo"},{"project":"perses","dashboard":"Benchmark","preview":"http://localhost:8080/projects/perses/ephemeraldashboards/Benchmark"},{"project":"testing","dashboard":"PanelGroups","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/PanelGroups"},{"project":"testing","dashboard":"Panels","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/Panels"},{"project":"testing","dashboard":"Variables","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/Variables"},{"project":"testing","dashboard":"MarkdownPanel","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/MarkdownPanel"},{"project":"testing","dashboard":"TimeSeriesChartPanel","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/TimeSeriesChartPanel"},{"project":"testing","dashboard":"GaugeChartPanel","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/GaugeChartPanel"},{"project":"testing","dashboard":"StatChartPanel","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/StatChartPanel"},{"project":"testing","dashboard":"DuplicatePanels","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/DuplicatePanels"},{"project":"testing","dashboard":"EditJson","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/EditJson"},{"project":"testing","dashboard":"Defaults","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/Defaults"},{"project":"testing","dashboard":"TimeSeriesChartLegends","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/TimeSeriesChartLegends"},{"project":"testing","dashboard":"table","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/table"},{"project":"perses","dashboard":"NodeExporter","preview":"http://localhost:8080/projects/perses/ephemeraldashboards/NodeExporter"},{"project":"testing","dashboard":"tracing","preview":"http://localhost:8080/projects/testing/ephemeraldashboards/tracing"}]
`,
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
