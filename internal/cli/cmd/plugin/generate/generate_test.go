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

package generate

import (
	"os"
	"path/filepath"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
)

const testFolder = "test"

func removeTestFiles() {
	if _, err := os.Stat(testFolder); !os.IsNotExist(err) {
		dirEntries, err := os.ReadDir(testFolder)
		if err != nil {
			panic(err)
		}
		for _, entry := range dirEntries {
			if entry.Name() != ".gitkeep" {
				err := os.RemoveAll(testFolder + "/" + entry.Name())
				if err != nil {
					panic(err)
				}
			}
		}
	}
}

func getFileList(filePaths []string) string {
	listString := ""

	for _, fp := range filePaths {
		listString += "- " + filepath.FromSlash(fp) + "\n"
	}

	return listString
}

func TestPluginGenerateCMD(t *testing.T) {
	removeTestFiles()

	testSuite := []cmdTest.Suite{
		{
			Title: "Try to build module without a name",
			Args: []string{
				"--plugin.name", "MyTestDatasource",
				"--plugin.type", "Datasource",
				testFolder,
			},
			IsErrorExpected:      true,
			ExpectedRegexMessage: "module.name and module.org are required when creating a new module as none was found under",
		},
		{
			Title: "Build module with a plugin",
			Args: []string{
				"--module.name", "MyPluginModule",
				"--module.org", "MyPluginOrg",
				"--plugin.name", "MyTestDatasource",
				"--plugin.type", "Datasource",
				testFolder,
			},
			IsErrorExpected: false,
			ExpectedMessage: `module MyPluginModule created successfully, plugin MyTestDatasource generated successfully
` + getFileList([]string{
				".cjs.swcrc",
				".gitignore",
				".swcrc",
				"LICENSE",
				"README.md",
				"cue.mod/module.cue",
				"go.mod",
				"go.sum",
				"jest.config.ts",
				"package.json",
				"rsbuild.config.ts",
				"src/bootstrap.tsx",
				"src/env.d.ts",
				"src/getPluginModule.ts",
				"src/index-federation.ts",
				"src/index.ts",
				"src/setup-tests.ts",
				"tsconfig.build.json",
				"tsconfig.json",
				"schemas/datasources/my-test-datasource/my-test-datasource.cue",
				"schemas/datasources/my-test-datasource/my-test-datasource.json",
				"src/datasources/index.ts",
				"src/datasources/my-test-datasource/index.ts",
				"src/datasources/my-test-datasource/my-test-datasource-types.ts",
				"src/datasources/my-test-datasource/MyTestDatasource.tsx",
				"src/datasources/my-test-datasource/MyTestDatasourceEditor.tsx",
			}),
		},
		{
			Title: "Build a plugin in an existing module",
			Args: []string{
				"--plugin.name", "MyTestPanel",
				"--plugin.type", "Panel",
				testFolder,
			},
			IsErrorExpected: false,
			ExpectedMessage: `plugin MyTestPanel generated successfully
` + getFileList([]string{
				".cjs.swcrc",
				".gitignore",
				".swcrc",
				"LICENSE",
				"README.md",
				"cue.mod/module.cue",
				"go.mod",
				"go.sum",
				"jest.config.ts",
				"package.json",
				"rsbuild.config.ts",
				"src/bootstrap.tsx",
				"src/env.d.ts",
				"src/getPluginModule.ts",
				"src/index-federation.ts",
				"src/index.ts",
				"src/setup-tests.ts",
				"tsconfig.build.json",
				"tsconfig.json",
				"schemas/panels/my-test-panel/my-test-panel.cue",
				"schemas/panels/my-test-panel/my-test-panel.json",
				"src/panels/index.ts",
				"src/panels/my-test-panel/index.ts",
				"src/panels/my-test-panel/my-test-panel-types.ts",
				"src/panels/my-test-panel/MyTestPanel.tsx",
				"src/panels/my-test-panel/MyTestPanelComponent.tsx",
				"src/panels/my-test-panel/MyTestPanelSettingsEditor.tsx"}),
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
