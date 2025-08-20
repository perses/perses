// Copyright 2023 The Perses Authors
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

package migrate

import (
	"path/filepath"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/perses/perses/internal/test"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

// reuse the test data from the plugin package
var testDataFolder = filepath.Join(test.GetRepositoryPath(), "internal", "api", "plugin", "migrate", "testdata")

func TestMigrateCMD(t *testing.T) {
	pathToGrafanaDashboard := filepath.Join(testDataFolder, "dashboards", "basic_grafana_dashboard.json")
	pathToPersesDashboard := filepath.Join(testDataFolder, "dashboards", "basic_perses_dashboard.json")
	var dashboard *modelV1.Dashboard
	test.JSONUnmarshalFromFile(pathToPersesDashboard, &dashboard)
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: `required flag(s) "file" not set`,
		},
		{
			Title:           "use args",
			Args:            []string{"whatever", "-f", "file.json"},
			IsErrorExpected: true,
			ExpectedMessage: "no args are supported by the command 'migrate'",
		},
		{
			Title:           "migrate with native format",
			Args:            []string{"-f", pathToGrafanaDashboard, "--format", "native", "--plugin.path", filepath.Join(testDataFolder, "plugins")},
			IsErrorExpected: false,
			ExpectedMessage: string(test.YAMLMarshalStrict(dashboard)) + "\n",
		},
		{
			Title:           "migrate with custom resource format",
			Args:            []string{"-f", pathToGrafanaDashboard, "--format", "custom-resource", "--plugin.path", filepath.Join(testDataFolder, "plugins")},
			IsErrorExpected: false,
			ExpectedMessage: string(test.YAMLMarshalStrict(createCustomResource(dashboard))) + "\n",
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
