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

//go:build cue

package lint

import (
	"path/filepath"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	testutil "github.com/perses/perses/internal/test"
)

func TestPluginLintCMD(t *testing.T) {
	projectPath := testutil.GetRepositoryPath()
	testSuite := []cmdTest.Suite{
		{
			Title:           "Lint plugin",
			Args:            []string{"--plugin.path", filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "build", "testdata", "barchart")},
			IsErrorExpected: false,
			ExpectedMessage: "current plugin is valid\n",
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
