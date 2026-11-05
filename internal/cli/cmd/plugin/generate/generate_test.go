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
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/spf13/cobra"
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

// fakeGo records the go commands instead of running them, so the tests don't download modules. `go mod init` writes
// a go.mod, since the generator checks for it.
type fakeGo struct {
	calls [][]string
}

func (f *fakeGo) run(_ context.Context, dir string, args ...string) ([]byte, error) {
	f.calls = append(f.calls, args)
	if len(args) == 3 && args[0] == "mod" && args[1] == "init" {
		return nil, os.WriteFile(filepath.Join(dir, "go.mod"), []byte("module "+args[2]+"\n"), 0o600)
	}
	return nil, nil
}

func (f *fakeGo) newCMD() *cobra.Command {
	return newCMD(f.run)
}

func TestPluginGenerateCMD(t *testing.T) {
	removeTestFiles()
	defer removeTestFiles()

	goCmd := &fakeGo{}

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
				"sdk/go/datasources/my-test-datasource/my-test-datasource.go",
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
				"sdk/go/panels/my-test-panel/my-test-panel.go",
				"src/panels/index.ts",
				"src/panels/my-test-panel/index.ts",
				"src/panels/my-test-panel/my-test-panel-types.ts",
				"src/panels/my-test-panel/MyTestPanel.tsx",
				"src/panels/my-test-panel/MyTestPanelComponent.tsx",
				"src/panels/my-test-panel/MyTestPanelSettingsEditor.tsx"}),
		},
	}
	cmdTest.ExecuteSuiteTest(t, goCmd.newCMD, testSuite)

	assert.Equal(t, [][]string{
		{"mod", "init", "github.com/my-plugin-org/my-plugin-module"},
		{"get", "github.com/perses/perses@" + persesModuleVersion()},
		{"mod", "tidy"},
		// The panel added to the existing module brings new imports, so the dependencies are resolved again.
		{"get", "github.com/perses/perses@" + persesModuleVersion()},
		{"mod", "tidy"},
	}, goCmd.calls)
}

// generateModule creates a module with a datasource plugin under dir.
func generateModule(t *testing.T, dir string) {
	t.Helper()

	cmdTest.ExecuteSuiteTest(t, (&fakeGo{}).newCMD, []cmdTest.Suite{
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

	goCmd := &fakeGo{}
	cmdTest.ExecuteSuiteTest(t, goCmd.newCMD, []cmdTest.Suite{
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

	// The existing module is not initialized again, only its dependencies are resolved for the new Go SDK.
	assert.Equal(t, [][]string{
		{"get", "github.com/perses/perses@" + persesModuleVersion()},
		{"mod", "tidy"},
	}, goCmd.calls)
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

func TestGetGoPackageName(t *testing.T) {
	for name, expected := range map[string]string{
		"MyTestPanel":       "mytestpanel",
		"my-test-panel":     "mytestpanel",
		"my_test panel 2":   "mytestpanel2",
		"MyTestDatasource":  "mytestdatasource",
		"ISO-8601 Time":     "iso8601time",
		"already lowercase": "alreadylowercase",
	} {
		assert.Equal(t, expected, GetGoPackageName(name), name)
	}
}

// TestGeneratedGoSDKCompiles generates every plugin type that has a Go SDK into one module, with the go commands run
// for real except that the perses module is replaced by this checkout, then builds the module.
func TestGeneratedGoSDKCompiles(t *testing.T) {
	if _, err := exec.LookPath("go"); err != nil {
		t.Skip("the go binary is required")
	}
	persesRoot, err := filepath.Abs(filepath.Join("..", "..", "..", "..", ".."))
	require.NoError(t, err)
	require.FileExists(t, filepath.Join(persesRoot, "go.mod"))

	run := func(ctx context.Context, dir string, args ...string) ([]byte, error) {
		if args[0] == "get" {
			// Use this checkout instead of downloading the released module.
			args = []string{"mod", "edit",
				"-require=github.com/perses/perses@v0.0.0-00010101000000-000000000000",
				"-replace=github.com/perses/perses=" + filepath.ToSlash(persesRoot)}
		}
		return runGo(ctx, dir, args...)
	}

	dir := t.TempDir()
	for i, pluginType := range pluginTypesWithGoSDK {
		args := []string{"--plugin.name", fmt.Sprintf("MyTest%s", pluginType), "--plugin.type", string(pluginType), dir}
		if i == 0 {
			args = append([]string{"--module.name", "MyPluginModule", "--module.org", "MyPluginOrg"}, args...)
		}
		cmdTest.ExecuteSuiteTest(t, func() *cobra.Command { return newCMD(run) }, []cmdTest.Suite{
			{
				Title:                fmt.Sprintf("Generate a %s plugin", pluginType),
				Args:                 args,
				ExpectedRegexMessage: `generated successfully`,
			},
		})
	}

	goMod, err := os.ReadFile(filepath.Join(dir, "go.mod")) //nolint:gosec // the path is inside t.TempDir
	require.NoError(t, err)
	assert.Contains(t, string(goMod), "github.com/perses/perses ")

	out, err := runGo(context.Background(), dir, "build", "./...")
	require.NoError(t, err, string(out))
}
