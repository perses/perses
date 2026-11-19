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
	"errors"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"text/template"

	"github.com/perses/perses/internal/api/plugin"
	cmdTest "github.com/perses/perses/internal/cli/test"
	pluginSpec "github.com/perses/spec/go/plugin"
	"github.com/prometheus/common/version"
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
// a go.mod, since the generator checks for it. failures makes a subcommand ("get", "mod tidy"...) fail.
type fakeGo struct {
	calls    [][]string
	failures map[string]error
}

func (f *fakeGo) run(_ context.Context, dir string, args ...string) ([]byte, error) {
	f.calls = append(f.calls, args)
	subcommand := args[0]
	if subcommand == "mod" && len(args) > 1 {
		subcommand += " " + args[1]
	}
	if err, ok := f.failures[subcommand]; ok {
		return []byte("go: something went wrong"), err
	}
	if len(args) == 3 && args[0] == "mod" && args[1] == "init" {
		return nil, os.WriteFile(filepath.Join(dir, "go.mod"), []byte("module "+args[2]+"\n"), 0o600)
	}
	// Like go, `go get` adds the requirement to go.mod, so a later generation sees it.
	if len(args) == 2 && args[0] == "get" {
		modPath, modVersion, _ := strings.Cut(args[1], "@")
		goMod, err := os.OpenFile(filepath.Clean(filepath.Join(dir, "go.mod")), os.O_APPEND|os.O_WRONLY, 0)
		if err != nil {
			return nil, err
		}
		_, err = fmt.Fprintf(goMod, "\nrequire %s %s\n", modPath, modVersion)
		return nil, errors.Join(err, goMod.Close())
	}
	return nil, nil
}

// setPercliVersion sets the version of this percli build for the duration of the test.
func setPercliVersion(t *testing.T, v string) {
	t.Helper()
	previous := version.Version
	version.Version = v
	t.Cleanup(func() { version.Version = previous })
}

func (f *fakeGo) newCMD() *cobra.Command {
	return newCMD(f.run)
}

func TestPluginGenerateCMD(t *testing.T) {
	removeTestFiles()
	defer removeTestFiles()
	setPercliVersion(t, "0.55.0")

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
		{
			Title: "Build a variable plugin in an existing module",
			Args: []string{
				"--plugin.name", "MyTestVariable",
				"--plugin.type", "Variable",
				testFolder,
			},
			IsErrorExpected: false,
			ExpectedMessage: `plugin MyTestVariable generated successfully
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
				"schemas/variables/my-test-variable/my-test-variable.cue",
				"schemas/variables/my-test-variable/my-test-variable.json",
				"src/variables/index.ts",
				"src/variables/my-test-variable/constants.ts",
				"src/variables/my-test-variable/get-variable-options.ts",
				"src/variables/my-test-variable/index.ts",
				"src/variables/my-test-variable/my-test-variable-types.ts",
				"src/variables/my-test-variable/MyTestVariable.tsx",
				"src/variables/my-test-variable/MyTestVariableEditor.tsx"}),
		},
	}
	cmdTest.ExecuteSuiteTest(t, goCmd.newCMD, testSuite)

	assert.Equal(t, [][]string{
		{"mod", "init", "github.com/my-plugin-org/my-plugin-module"},
		{"get", "github.com/perses/perses@v0.55.0"},
		{"mod", "tidy"},
		// The module already requires perses, so the panel added to it only resolves its new imports.
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

// writeGoMod replaces the go.mod of the module under dir.
func writeGoMod(t *testing.T, dir, content string) {
	t.Helper()
	require.NoError(t, os.WriteFile(filepath.Join(dir, "go.mod"), []byte(content), 0o600))
}

func TestPluginGenerateDoesNotReinitializeExistingGoMod(t *testing.T) {
	setPercliVersion(t, "0.55.0")
	dir := t.TempDir()
	generateModule(t, dir)
	writeGoMod(t, dir, "module example.com/custom\n\ngo 1.21\n")

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

	// The existing module is not initialized again, only its dependencies are resolved for the new Go SDK.
	assert.Equal(t, [][]string{
		{"get", "github.com/perses/perses@v0.55.0"},
		{"mod", "tidy"},
	}, goCmd.calls)
}

func TestPluginGeneratePersesRequirement(t *testing.T) {
	for _, tc := range []struct {
		name          string
		percliVersion string
		required      string
		expectedCalls [][]string
		expectedMsg   string
	}{
		{
			name:          "older perses is upgraded",
			percliVersion: "0.55.0",
			required:      "v0.54.0",
			expectedCalls: [][]string{{"get", "github.com/perses/perses@v0.55.0"}, {"mod", "tidy"}},
		},
		{
			name:          "same perses is left as is",
			percliVersion: "0.55.0",
			required:      "v0.55.0",
			expectedCalls: [][]string{{"mod", "tidy"}},
		},
		{
			name:          "newer perses is kept",
			percliVersion: "0.55.0",
			required:      "v0.55.1",
			expectedCalls: [][]string{{"mod", "tidy"}},
			expectedMsg:   `warning: the module requires github.com/perses/perses v0.55.1, which is newer than v0.55.0`,
		},
		{
			name:          "development build keeps the existing perses",
			required:      "v0.54.0",
			expectedCalls: [][]string{{"mod", "tidy"}},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			setPercliVersion(t, tc.percliVersion)
			dir := t.TempDir()
			generateModule(t, dir)
			writeGoMod(t, dir, "module example.com/custom\n\ngo 1.21\n\nrequire github.com/perses/perses "+tc.required+"\n")

			expectedMsg := tc.expectedMsg
			if expectedMsg == "" {
				expectedMsg = `^plugin MyTestPanel generated successfully`
			}
			goCmd := &fakeGo{}
			cmdTest.ExecuteSuiteTest(t, goCmd.newCMD, []cmdTest.Suite{
				{
					Title:                "Build a panel",
					Args:                 []string{"--plugin.name", "MyTestPanel", "--plugin.type", "Panel", dir},
					ExpectedRegexMessage: expectedMsg,
				},
			})
			assert.Equal(t, tc.expectedCalls, goCmd.calls)
		})
	}
}

func TestPluginGenerateWithoutGoSDKLeavesExistingGoMod(t *testing.T) {
	dir := t.TempDir()
	generateModule(t, dir)

	goCmd := &fakeGo{}
	cmdTest.ExecuteSuiteTest(t, goCmd.newCMD, []cmdTest.Suite{
		{
			Title:                "Build an explore plugin in a module that already has a go.mod",
			Args:                 []string{"--plugin.name", "MyTestExplore", "--plugin.type", "Explore", dir},
			ExpectedRegexMessage: `plugin MyTestExplore generated successfully`,
		},
	})
	assert.Empty(t, goCmd.calls, "no go command must run for a plugin without a Go SDK")
}

func TestPluginGenerateGoFailure(t *testing.T) {
	setPercliVersion(t, "0.55.0")
	dir := t.TempDir()

	goCmd := &fakeGo{failures: map[string]error{"get": errors.New("exit status 1")}}
	cmdTest.ExecuteSuiteTest(t, goCmd.newCMD, []cmdTest.Suite{
		{
			Title: "Build a module when go get fails",
			Args: []string{
				"--module.name", "MyPluginModule",
				"--module.org", "MyPluginOrg",
				"--plugin.name", "MyTestPanel",
				"--plugin.type", "Panel",
				dir,
			},
			IsErrorExpected: true,
			ExpectedRegexMessage: "(?s)`go get github.com/perses/perses@v0.55.0` failed under .*go: something went wrong.*" +
				"run the command again or run `go get github.com/perses/perses@v0.55.0 && go mod tidy`",
		},
	})

	// The generation stops at the failing command.
	assert.Equal(t, [][]string{
		{"mod", "init", "github.com/my-plugin-org/my-plugin-module"},
		{"get", "github.com/perses/perses@v0.55.0"},
	}, goCmd.calls)
}

func TestPluginGenerateRejectsGoSDKNames(t *testing.T) {
	for _, tc := range []struct {
		pluginType pluginSpec.Kind
		name       string
		expected   string
	}{
		{pluginSpec.KindPanel, "Map", `"map" isn't a valid Go package name`},
		{pluginSpec.KindPanel, "Switch", `"switch" isn't a valid Go package name`},
		{pluginSpec.KindPanel, "Main", `"main" isn't a valid Go package name`},
		{pluginSpec.KindPanel, "---", `"" isn't a valid Go package name`},
		{pluginSpec.KindDatasource, "3D Source", `"3dsource" isn't a valid Go package name`},
		{pluginSpec.KindPanel, "Legend", `its Go SDK already declares Legend`},
		{pluginSpec.KindTimeSeriesQuery, "Datasource", `its Go SDK already declares Datasource`},
		{pluginSpec.KindDatasource, "Builder", `its Go SDK already declares Builder`},
		{pluginSpec.KindAnnotation, "Tags", `its Go SDK already declares Tags`},
		{pluginSpec.KindPanel, "Météo", `plugin.name "météo" can't be used for the Go SDK, as it names the directory`},
		{pluginSpec.KindDatasource, "smoke_test", `plugin.name "smoke_test" can't be used for the Go SDK, as it names the directory`},
		{pluginSpec.KindPanel, "status_linux", `plugin.name "status_linux" can't be used for the Go SDK, as it names the directory`},
		{pluginSpec.KindPanel, "_Hidden", `plugin.name "_hidden" can't be used for the Go SDK, as it names the directory`},
		{pluginSpec.KindPanel, "Init", `"init" isn't a valid Go package name`},
		{pluginSpec.KindAnnotation, "Docu Mentation", `"documentation" isn't a valid Go package name`},
		{pluginSpec.KindPanel, "Internal", `plugin.name "internal" can't be used for the Go SDK, as go treats a directory`},
		{pluginSpec.KindDatasource, "Testdata", `plugin.name "testdata" can't be used for the Go SDK, as go treats a directory`},
		{pluginSpec.KindPanel, "Aux", `plugin.name "aux" can't be used for the Go SDK, as go treats a directory`},
	} {
		t.Run(fmt.Sprintf("%s %s", tc.pluginType, tc.name), func(t *testing.T) {
			dir := t.TempDir()
			cmdTest.ExecuteSuiteTest(t, (&fakeGo{}).newCMD, []cmdTest.Suite{
				{
					Title: "Build a plugin with a name the Go SDK can't use",
					Args: []string{
						"--module.name", "MyPluginModule",
						"--module.org", "MyPluginOrg",
						"--plugin.name", tc.name,
						"--plugin.type", string(tc.pluginType),
						dir,
					},
					IsErrorExpected:      true,
					ExpectedRegexMessage: regexp.QuoteMeta(tc.expected),
				},
			})
			entries, err := os.ReadDir(dir)
			require.NoError(t, err)
			assert.Empty(t, entries, "nothing must be generated for a rejected name")
		})
	}
}

// TestGoSDKDeclarations checks that goSDKDeclarations lists every exported identifier the Go SDK templates declare,
// besides the constructor named after the plugin.
func TestGoSDKDeclarations(t *testing.T) {
	const placeholder = "PlaceholderName"
	for _, pluginType := range pluginTypesWithGoSDK {
		t.Run(string(pluginType), func(t *testing.T) {
			srcDir, err := getTemplatePath(pluginType)
			require.NoError(t, err)

			var declared []string
			err = fs.WalkDir(embeddedTemplates, srcDir, func(p string, d fs.DirEntry, err error) error {
				if err != nil || d.IsDir() || !strings.Contains(p, "/sdk/go/") || !strings.HasSuffix(p, ".go"+tmplExt) {
					return err
				}
				content, err := fs.ReadFile(embeddedTemplates, p)
				require.NoError(t, err)
				var rendered strings.Builder
				require.NoError(t, template.Must(template.New(p).Parse(string(content))).Execute(&rendered, map[string]any{
					"PluginName":       "placeholder-name",
					"PluginPascalName": placeholder,
					"PluginGoPackage":  "placeholdername",
				}))
				file, err := parser.ParseFile(token.NewFileSet(), p, rendered.String(), 0)
				require.NoError(t, err)
				for _, decl := range file.Decls {
					switch decl := decl.(type) {
					case *ast.FuncDecl:
						if decl.Recv == nil {
							declared = append(declared, decl.Name.Name)
						}
					case *ast.GenDecl:
						for _, spec := range decl.Specs {
							switch spec := spec.(type) {
							case *ast.TypeSpec:
								declared = append(declared, spec.Name.Name)
							case *ast.ValueSpec:
								for _, n := range spec.Names {
									declared = append(declared, n.Name)
								}
							}
						}
					}
				}
				return nil
			})
			require.NoError(t, err)

			var exported []string
			for _, name := range declared {
				if name != placeholder && ast.IsExported(name) {
					exported = append(exported, name)
				}
			}
			require.NotEmpty(t, exported)
			assert.ElementsMatch(t, goSDKDeclarations[pluginType], exported)
		})
	}
}

func TestPersesModuleVersion(t *testing.T) {
	for _, tc := range []struct {
		name          string
		buildVersion  string
		moduleVersion string
		expected      string
		expectedErr   bool
	}{
		{name: "development build", expected: "latest"},
		{name: "development build with devel module", moduleVersion: "(devel)", expected: "latest"},
		{name: "build version", buildVersion: "0.55.0", expected: "v0.55.0"},
		{name: "build version with v", buildVersion: "v0.55.0", expected: "v0.55.0"},
		{name: "pre-release build version", buildVersion: "0.56.0-beta.1", expected: "v0.56.0-beta.1"},
		{name: "build version wins over the module version", buildVersion: "0.55.0", moduleVersion: "v0.54.0", expected: "v0.55.0"},
		{name: "invalid build version", buildVersion: "main", expectedErr: true},
		{name: "go install", moduleVersion: "v0.55.1", expected: "v0.55.1"},
		{name: "pseudo-version", moduleVersion: "v0.55.2-0.20261118101010-0123456789ab", expected: "latest"},
		{name: "modified checkout", moduleVersion: "v0.55.1+dirty", expected: "latest"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			v, err := persesModuleVersion(tc.buildVersion, tc.moduleVersion)
			if tc.expectedErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tc.expected, v)
		})
	}
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
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, expected, GetGoPackageName(name))
		})
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
	// The temporary module is outside of any go.work the environment may point to.
	t.Setenv("GOWORK", "off")

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
	out, err = runGo(context.Background(), dir, "vet", "./...")
	require.NoError(t, err, string(out))
}

func TestPluginGenerateEveryPluginType(t *testing.T) {
	for _, pluginType := range availablePluginTypes {
		t.Run(string(pluginType), func(t *testing.T) {
			dir := t.TempDir()
			pluginName := "MyTest" + string(pluginType)

			cmdTest.ExecuteSuiteTest(t, new(fakeGo).newCMD, []cmdTest.Suite{
				{
					Title: "Build module with a " + string(pluginType) + " plugin",
					Args: []string{
						"--module.name", "MyPluginModule",
						"--module.org", "MyPluginOrg",
						"--plugin.name", pluginName,
						"--plugin.type", string(pluginType),
						dir,
					},
					ExpectedRegexMessage: `plugin ` + pluginName + ` generated successfully`,
				},
			})

			pluginPath, err := getPluginPath(pluginName, pluginType)
			require.NoError(t, err)
			assert.DirExists(t, filepath.Join(dir, filepath.FromSlash(pluginPath)))

			npmPackage, err := plugin.ReadPackage(dir)
			require.NoError(t, err)
			require.Len(t, npmPackage.Perses.Plugins, 1)
			assert.Equal(t, pluginType, npmPackage.Perses.Plugins[0].Kind)
		})
	}
}
