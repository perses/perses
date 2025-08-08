// Copyright 2025 The Perses Authors
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

package testschemas

import (
	"path/filepath"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	testutil "github.com/perses/perses/internal/test"
)

func TestPluginTestSchemasCMD(t *testing.T) {
	projectPath := testutil.GetRepositoryPath()
	testSuite := []cmdTest.Suite{
		{
			Title:           "Schema test for panel plugin",
			Args:            []string{"--plugin.path", filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "testschemas", "testdata", "my-panel-plugin")},
			IsErrorExpected: false,
			ExpectedMessage: "✓ advanced-config.json (model-valid) [tests\\valid\\advanced-config.json]\n✓ basic-config.json (model-valid) [tests\\valid\\basic-config.json]\n✓ invalid-type.json (model-invalid) [tests\\invalid\\invalid-type.json]\n✓ missing-required.json (model-invalid) [tests\\invalid\\missing-required.json]\n✓ basic-migration (migrate) [migrate\\tests\\basic-migration]\n✓ complex-migration (migrate) [migrate\\tests\\complex-migration]\n\nTest Results: 6 passed, 0 failed\nAll schema tests passed\n",
		},
		{
			Title:           "Schema test for datasource plugin (multi-plugins)",
			Args:            []string{"--plugin.path", filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "testschemas", "testdata", "my-datasource-plugin")},
			IsErrorExpected: false,
			ExpectedMessage: "✓ basic-datasource.json (model-valid) [my-datasource\\tests\\valid\\basic-datasource.json]\n✓ empty-url.json (model-invalid) [my-datasource\\tests\\invalid\\empty-url.json]\n✓ basic-variable.json (model-valid) [my-variable\\tests\\valid\\basic-variable.json]\n✓ invalid-options.json (model-invalid) [my-variable\\tests\\invalid\\invalid-options.json]\n✓ basic-migration (migrate) [my-query\\migrate\\tests\\basic-migration]\n✓ basic-migration (migrate) [my-variable\\migrate\\tests\\basic-migration]\n\nTest Results: 6 passed, 0 failed\nAll schema tests passed\n",
		},
		{
			Title:           "Schema test for plugin without schemas",
			Args:            []string{"--plugin.path", filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "build", "testdata", "barchart")},
			IsErrorExpected: false,
			ExpectedMessage: "No tests found\n",
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
