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
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	pluginSpec "github.com/perses/spec/go/plugin"
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

func TestGeneratedModuleConfiguration(t *testing.T) {
	for _, kind := range []pluginSpec.Kind{
		pluginSpec.KindDatasource,
		pluginSpec.KindTimeSeriesQuery,
		pluginSpec.KindAnnotation,
		pluginSpec.KindPanel,
		pluginSpec.KindExplore,
	} {
		t.Run(string(kind), func(t *testing.T) {
			dir := t.TempDir()
			o := &generateOptions{
				pluginModuleName: "SampleModule",
				pluginModuleOrg:  "Example",
				pluginName:       "Sample",
				pluginType:       kind,
				outputDir:        dir,
				writer:           io.Discard,
			}
			require.NoError(t, o.Validate())
			require.NoError(t, o.Execute())

			read := func(name string) string {
				t.Helper()
				data, err := os.ReadFile(filepath.Join(dir, name))
				require.NoError(t, err)
				return string(data)
			}
			var pkg struct {
				Name             string            `json:"name"`
				Type             string            `json:"type"`
				Main             string            `json:"main"`
				Module           string            `json:"module"`
				Types            string            `json:"types"`
				Scripts          map[string]string `json:"scripts"`
				DevDependencies  map[string]string `json:"devDependencies"`
				PeerDependencies map[string]string `json:"peerDependencies"`
			}
			require.NoError(t, json.Unmarshal([]byte(read("package.json")), &pkg))
			assert.Equal(t, "@example/sample-module", pkg.Name)
			assert.Equal(t, "module", pkg.Type)
			assert.Equal(t, "lib/index.js", pkg.Main)
			assert.Equal(t, pkg.Main, pkg.Module)
			assert.Equal(t, "lib/index.d.ts", pkg.Types)
			assert.NotContains(t, pkg.Scripts, "build:cjs")
			assert.Contains(t, pkg.Scripts["build:esm"], "dist/lib")
			assert.Contains(t, pkg.Scripts["test"], "vitest run")
			assert.NotContains(t, pkg.DevDependencies, "jest")
			for _, dependency := range []string{"typescript", "@types/node", "@types/react", "cross-env", "vitest", "jsdom", "oxlint-plugin-react-doctor"} {
				assert.NotEmpty(t, pkg.DevDependencies[dependency], "standalone module needs %s", dependency)
			}
			assert.Equal(t, pkg.PeerDependencies["react"], pkg.DevDependencies["react"])

			assert.NoFileExists(t, filepath.Join(dir, "jest.config.ts"))
			assert.Contains(t, read("vitest.config.ts"), "./src/setup-tests.ts")
			assert.NotContains(t, read("vitest.config.ts"), "../vitest.shared")
			assert.Contains(t, read("src/setup-tests.ts"), "@testing-library/jest-dom/vitest")
			assert.Contains(t, read("src/getPluginModule.ts"), "with { type: 'json' }")

			var tsconfig struct {
				CompilerOptions struct {
					Target string   `json:"target"`
					Types  []string `json:"types"`
				} `json:"compilerOptions"`
			}
			require.NoError(t, json.Unmarshal([]byte(read("tsconfig.json")), &tsconfig))
			assert.Equal(t, "es2023", tsconfig.CompilerOptions.Target)
			assert.Contains(t, tsconfig.CompilerOptions.Types, "vitest/globals")

			var swc struct {
				JSC struct {
					Target       string `json:"target"`
					Experimental struct {
						KeepImportAttributes bool `json:"keepImportAttributes"`
					} `json:"experimental"`
				} `json:"jsc"`
				Module struct {
					Type string `json:"type"`
				} `json:"module"`
			}
			require.NoError(t, json.Unmarshal([]byte(read(".swcrc")), &swc))
			assert.Equal(t, tsconfig.CompilerOptions.Target, swc.JSC.Target)
			assert.True(t, swc.JSC.Experimental.KeepImportAttributes)
			assert.Equal(t, "es6", swc.Module.Type)

			config := read("rsbuild.config.ts")
			assert.Contains(t, config, "const name = 'SampleModule'")
			assert.Contains(t, config, "${name}~${version}")
			assert.Contains(t, config, "library: { type: 'global', name: globalName }")
			assert.Contains(t, config, "config.output.chunkLoadingGlobal")
			pluginPath, err := getPluginPath("Sample", kind)
			require.NoError(t, err)
			assert.Contains(t, config, "./"+pluginPath)
		})
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
				"go.mod",
				"go.sum",
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
				"go.mod",
				"go.sum",
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
