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

package schematest

import (
	"path/filepath"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	testutil "github.com/perses/perses/internal/test"
)

func TestPluginSchemaTestCMD(t *testing.T) {
	projectPath := testutil.GetRepositoryPath()
	testSuite := []cmdTest.Suite{
		{
			Title:           "Schema test for panel plugin",
			Args:            []string{"--plugin.path", filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "schematest", "testdata", "my-panel-plugin")},
			IsErrorExpected: false,
			ExpectedMessage: "✓ advanced-config.json (model-valid)\n✓ basic-config.json (model-valid)\n✓ invalid-type.json (model-invalid)\n✓ missing-required.json (model-invalid)\n✓ basic-migration (migrate)\n✓ complex-migration (migrate)\n\nTest Results: 6 passed, 0 failed\nAll schema tests passed\n",
		},
		{
			Title:           "Schema test for datasource plugin (multi-plugins)",
			Args:            []string{"--plugin.path", filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "schematest", "testdata", "my-datasource-plugin")},
			IsErrorExpected: false,
			ExpectedMessage: "✓ basic-datasource.json (model-valid)\n✓ empty-url.json (model-invalid)\n✓ basic-variable.json (model-valid)\n✓ invalid-options.json (model-invalid)\n✓ basic-migration (migrate)\n✓ basic-migration (migrate)\n\nTest Results: 6 passed, 0 failed\nAll schema tests passed\n",
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
