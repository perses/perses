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

package generate

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
	defer removeTestFiles()

	testSuite := []cmdTest.Suite{
		{
			Title: "Try to build module without a name",
			Args: []string{
				"--plugin.name", "MyTestDatasource",
				"--plugin.type", "Datasource",
				testFolder,
			},
			IsErrorExpected:      true,
			ExpectedRegexMessage: `module\.name and module\.org are required when creating a new module as none was found under`,
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
				".gitignore",
				".oxfmtrc.json",
				".oxlintrc.json",
				".swcrc",
				"LICENSE",
				"README.md",
				"cue.mod/module.cue",
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
				"vitest.config.ts",
				"schemas/datasources/my-test-datasource/my-test-datasource.cue",
				"schemas/datasources/my-test-datasource/my-test-datasource.json",
				"src/datasources/index.ts",
				"src/datasources/my-test-datasource/index.ts",
				"src/datasources/my-test-datasource/my-test-datasource-types.ts",
				"src/datasources/my-test-datasource/MyTestDatasource.tsx",
				"src/datasources/my-test-datasource/MyTestDatasourceEditor.tsx",
				"go.mod",
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
				".gitignore",
				".oxfmtrc.json",
				".oxlintrc.json",
				".swcrc",
				"LICENSE",
				"README.md",
				"cue.mod/module.cue",
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
				"vitest.config.ts",
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

// generateModule creates a module with a datasource plugin under dir.
func generateModule(t *testing.T, dir string) {
	t.Helper()

	cmdTest.ExecuteSuiteTest(t, NewCMD, []cmdTest.Suite{
		{
			Title: "Build module with a plugin",
			Args: []string{
				"--module.name", "MyPluginModule",
				"--module.org", "MyPluginOrg",
				"--plugin.name", "MyTestDatasource",
				"--plugin.type", "Datasource",
				dir,
			},
			ExpectedRegexMessage: `module MyPluginModule created successfully`,
		},
	})
}

func TestPluginGenerateKeepsExistingGoMod(t *testing.T) {
	dir := t.TempDir()
	generateModule(t, dir)

	goModPath := filepath.Join(dir, "go.mod")
	customGoMod := "module example.com/custom\n\ngo 1.21\n"
	require.NoError(t, os.WriteFile(goModPath, []byte(customGoMod), 0o600))

	cmdTest.ExecuteSuiteTest(t, NewCMD, []cmdTest.Suite{
		{
			Title: "Build a plugin in a module that already has a go.mod",
			Args: []string{
				"--plugin.name", "MyTestPanel",
				"--plugin.type", "Panel",
				dir,
			},
			ExpectedRegexMessage: `plugin MyTestPanel generated successfully`,
		},
	})

	content, err := os.ReadFile(goModPath) //nolint:gosec // goModPath is inside t.TempDir
	require.NoError(t, err)
	assert.Equal(t, customGoMod, string(content))
}

func TestPluginGenerateFailsBeforeWritingWithoutGo(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("PATH", t.TempDir())

	cmdTest.ExecuteSuiteTest(t, NewCMD, []cmdTest.Suite{
		{
			Title: "Build a module without the go binary",
			Args: []string{
				"--module.name", "MyPluginModule",
				"--module.org", "MyPluginOrg",
				"--plugin.name", "MyTestDatasource",
				"--plugin.type", "Datasource",
				dir,
			},
			IsErrorExpected:      true,
			ExpectedRegexMessage: `the go binary is required to initialize the Go module`,
		},
	})

	entries, err := os.ReadDir(dir)
	require.NoError(t, err)
	assert.Empty(t, entries, "nothing must be generated when the go binary is missing")
}

func TestPluginGenerateFailsBeforeWritingWithEmptyRegistry(t *testing.T) {
	dir := t.TempDir()
	generateModule(t, dir)

	// An existing module without a go.mod and with an empty registry.
	require.NoError(t, os.Remove(filepath.Join(dir, "go.mod")))
	packageJSONPath := filepath.Join(dir, "package.json")
	packageJSON, err := os.ReadFile(packageJSONPath) //nolint:gosec // packageJSONPath is inside t.TempDir
	require.NoError(t, err)
	emptyRegistry := strings.Replace(string(packageJSON), `"registry": "my-plugin-org"`, `"registry": ""`, 1)
	require.NotEqual(t, string(packageJSON), emptyRegistry, "the registry must be present in the generated package.json")
	require.NoError(t, os.WriteFile(packageJSONPath, []byte(emptyRegistry), 0o600)) //nolint:gosec // packageJSONPath is inside t.TempDir

	cmdTest.ExecuteSuiteTest(t, NewCMD, []cmdTest.Suite{
		{
			Title: "Build a plugin in a module with an empty registry",
			Args: []string{
				"--plugin.name", "MyTestPanel",
				"--plugin.type", "Panel",
				dir,
			},
			IsErrorExpected:      true,
			ExpectedRegexMessage: `the module org and name are required to initialize the Go module`,
		},
	})

	assert.NoDirExists(t, filepath.Join(dir, "src", "panels", "my-test-panel"))
	assert.NoFileExists(t, filepath.Join(dir, "go.mod"))
}
