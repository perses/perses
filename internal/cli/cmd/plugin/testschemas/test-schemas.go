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

package testschemas

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/migrate"
	"github.com/perses/perses/internal/api/plugin/schema"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/cmd/plugin/config"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/model/api/v1/common"
	v1plugin "github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

// TestType represents the type of test being run
type TestType string

const (
	TestTypeModelValid   TestType = "model-valid"
	TestTypeModelInvalid TestType = "model-invalid"
	TestTypeMigrate      TestType = "migrate"
)

// TestResult represents the result of a single test
type TestResult struct {
	TestName string
	TestPath string // Path relative to schema directory
	TestType TestType
	Success  bool
	Error    string
}

type option struct {
	persesCMD.Option
	opt.OutputOption
	cfg        config.PluginConfig
	cfgPath    string
	pluginPath string
	writer     io.Writer
	errWriter  io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'plugin test-schemas'")
	}
	cfg, err := config.Resolve(o.pluginPath, o.cfgPath)
	if err != nil {
		return fmt.Errorf("unable to resolve the configuration: %w", err)
	}
	o.cfg = cfg
	// Overriding the paths using the plugin path
	o.cfg.DistPath = filepath.Join(o.pluginPath, o.cfg.DistPath)
	o.cfg.FrontendPath = filepath.Join(o.pluginPath, o.cfg.FrontendPath)
	o.cfg.SchemasPath = filepath.Join(o.pluginPath, o.cfg.SchemasPath)

	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	npmPackageData, readErr := plugin.ReadPackage(o.cfg.FrontendPath)
	if readErr != nil {
		return fmt.Errorf("unable to read plugin package.json: %w", readErr)
	}

	if !plugin.IsSchemaRequired(npmPackageData.Perses) {
		return output.HandleString(o.writer, "No schemas found in this plugin, nothing to test")
	}

	if _, err := os.Stat(filepath.Join(o.pluginPath, plugin.CuelangModuleFolder)); os.IsNotExist(err) {
		return fmt.Errorf("CUE module not found in %s", filepath.Join(o.pluginPath, plugin.CuelangModuleFolder))
	}

	results, err := o.runAllTests()
	if err != nil {
		return fmt.Errorf("failed to run tests: %w", err)
	}

	if len(results) == 0 {
		return output.HandleString(o.writer, "No tests found")
	}

	// Report test results using strings.Builder
	var outputBuilder strings.Builder
	passed := 0
	failed := 0
	for _, result := range results {
		if result.Success {
			passed++
			outputBuilder.WriteString(fmt.Sprintf("✓ %s (%s) [%s]\n", result.TestName, result.TestType, result.TestPath))
		} else {
			failed++
			outputBuilder.WriteString(fmt.Sprintf("✗ %s (%s) [%s]: %s\n", result.TestName, result.TestType, result.TestPath, result.Error))
		}
	}
	outputBuilder.WriteString(fmt.Sprintf("\nTest Results: %d passed, %d failed\n", passed, failed))

	if failed > 0 {
		outputBuilder.WriteString(fmt.Sprintf("%d test(s) failed\n", failed))
		fmt.Fprint(o.writer, outputBuilder.String())

		output.Handle(o.writer, o.Output, outputBuilder.String())

		return fmt.Errorf("%d test(s) failed", failed)
	}

	outputBuilder.WriteString("All schema tests passed\n")
	fmt.Fprint(o.writer, outputBuilder.String())
	return nil
}

// runAllTests runs both model and migration tests
func (o *option) runAllTests() ([]TestResult, error) {
	var allResults []TestResult

	// Walk the schemas directory and run tests when found
	err := filepath.WalkDir(o.cfg.SchemasPath, func(currentPath string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip non-directories
		if !d.IsDir() {
			return nil
		}

		// Process "tests" directories for model validation tests
		if d.Name() == "tests" {
			// Determine the plugin kind from the parent directory (which is assumed to be the entrypoint of the `model` CUE package, cf -h)
			parentDir := filepath.Dir(currentPath)

			_, buildInstance, err := schema.LoadModelSchema(parentDir)
			if err != nil {
				return err
			}

			// Look for "valid" and "invalid" subdirectories
			validPath := filepath.Join(currentPath, "valid")
			if _, err := os.Stat(validPath); err == nil {
				validResults, err := o.runModelValidationTests(validPath, buildInstance, true)
				if err != nil {
					return err
				}
				allResults = append(allResults, validResults...)
			}

			invalidPath := filepath.Join(currentPath, "invalid")
			if _, err := os.Stat(invalidPath); err == nil {
				invalidResults, err := o.runModelValidationTests(invalidPath, buildInstance, false)
				if err != nil {
					return err
				}
				allResults = append(allResults, invalidResults...)
			}

			return filepath.SkipDir
		}

		// Process "migrate/tests" directories for migration tests
		if d.Name() == "migrate" {
			migrateTestsPath := filepath.Join(currentPath, "tests")

			if _, err := os.Stat(migrateTestsPath); err == nil {
				buildInstance, err := migrate.LoadMigrateSchema(currentPath)

				if err != nil {
					return fmt.Errorf("failed to load migration schemas: %w", err)
				}

				migrateFilePath := filepath.Join(currentPath, "migrate.cue")
				pluginKind, err := migrate.GetPluginKind(migrateFilePath)
				if err != nil {
					return fmt.Errorf("unable to find the plugin kind associated to the migration file: %w", err)
				}
				// Run migration tests with the loaded schema
				migrateResults, err := o.runMigrationTestsForPath(migrateTestsPath, buildInstance, pluginKind)
				if err != nil {
					return err
				}

				allResults = append(allResults, migrateResults...)
			}

			// Skip further traversal of migrate directory after processing
			return filepath.SkipDir
		}
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("error walking schemas directory: %w", err)
	}

	return allResults, nil
}

// runModelValidationTests runs the model tests found in the provided directory
func (o *option) runModelValidationTests(testDir string, buildInstance *build.Instance, shouldBeValid bool) ([]TestResult, error) {
	var results []TestResult

	return results, filepath.WalkDir(testDir, func(currentPath string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if filepath.Ext(currentPath) != ".json" {
			return nil
		}

		testName := filepath.Base(currentPath)
		// Calculate relative path from schemas directory
		relPath, err := filepath.Rel(o.cfg.SchemasPath, currentPath)
		if err != nil {
			relPath = currentPath // Fallback to full path if relative path calculation fails
		}
		result := TestResult{
			TestName: testName,
			TestPath: relPath,
			TestType: map[bool]TestType{true: TestTypeModelValid, false: TestTypeModelInvalid}[shouldBeValid],
		}

		// Read test data
		data, err := os.ReadFile(currentPath)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to read test file: %v", err)
			results = append(results, result)
			return nil
		}

		// Unmarshal the JSON to the plugin struct
		var plugin common.Plugin
		if err := json.Unmarshal(data, &plugin); err != nil {
			result.Error = fmt.Sprintf("Failed to parse JSON: %v", err)
			results = append(results, result)
			return nil
		}

		// Validate the plugin against the schema
		ctx := cuecontext.New()
		pluginValue := ctx.CompileBytes(data)
		finalValue := pluginValue.Unify(ctx.BuildInstance(buildInstance))

		logrus.Debugf("Running model validation for %s", currentPath)
		validationErr := finalValue.Validate(schema.CueValidationOptions...)
		isValid := validationErr == nil

		if !isValid {
			logrus.Debugf("Evaluation error for %s: %v", testName, validationErr)
		}

		if shouldBeValid {
			result.Success = isValid
			if !isValid {
				result.Error = fmt.Sprintf("Expected valid data but validation failed: %v", validationErr)
			}
		} else {
			result.Success = !isValid
			if isValid {
				result.Error = "Expected invalid data but validation succeeded"
			}
		}

		results = append(results, result)
		return nil
	})
}

// runMigrationTestsForPath runs migration tests for a specific directory path
func (o *option) runMigrationTestsForPath(testDir string, buildInstance *build.Instance, pluginKind v1plugin.Kind) ([]TestResult, error) {
	var results []TestResult

	return results, filepath.WalkDir(testDir, func(currentPath string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			return nil
		}

		// Skip the root migrate directory
		if currentPath == testDir {
			return nil
		}

		testName := d.Name()

		relPath, err := filepath.Rel(o.cfg.SchemasPath, currentPath)
		if err != nil {
			relPath = currentPath // Fallback to full path if relative path calculation fails
		}

		result := TestResult{
			TestName: testName,
			TestPath: relPath,
			TestType: TestTypeMigrate,
		}

		// Look for input.json and expected.json in this directory
		inputPath := filepath.Join(currentPath, "input.json")
		expectedPath := filepath.Join(currentPath, "expected.json")

		if _, err := os.Stat(inputPath); os.IsNotExist(err) {
			result.Error = "input.json not found"
			results = append(results, result)
			return filepath.SkipDir
		}

		if _, err := os.Stat(expectedPath); os.IsNotExist(err) {
			result.Error = "expected.json not found"
			results = append(results, result)
			return filepath.SkipDir
		}

		// Read input data (Grafana format)
		inputData, err := os.ReadFile(inputPath)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to read input.json: %v", err)
			results = append(results, result)
			return filepath.SkipDir
		}

		// Read expected data (Perses format)
		expectedData, err := os.ReadFile(expectedPath)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to read expected.json: %v", err)
			results = append(results, result)
			return filepath.SkipDir
		}

		// Extract plugin kind from expected.json
		var expectedPlugin common.Plugin
		if err := json.Unmarshal(expectedData, &expectedPlugin); err != nil {
			result.Error = fmt.Sprintf("Failed to parse expected.json: %v", err)
			results = append(results, result)
			return filepath.SkipDir
		}

		// Determine the definition ID and type based on the plugin kind
		var defID, typeOfData string
		// Set default definition ID and type based on the plugin kind from the loaded schema
		switch pluginKind {
		case v1plugin.KindVariable:
			defID = "#var"
			typeOfData = "variable"
		case v1plugin.KindQuery:
			defID = "#target"
			typeOfData = "query"
		case v1plugin.KindPanel:
			defID = "#panel"
			typeOfData = "panel"
		default:
			return fmt.Errorf("unsupported migration schema kind: %s", pluginKind)
		}

		logrus.Debugf("Run migration test for plugin %s of type %s, using definition ID: %s and type: %s",
			expectedPlugin.Kind, pluginKind, defID, typeOfData)
		resultPlugin, resultIsEmpty, err := migrate.ExecuteCuelangMigrationScript(buildInstance, inputData, defID, typeOfData)
		logrus.Debugf("Migration results - success: %v, empty: %v, error: %v", resultPlugin != nil, resultIsEmpty, err)

		if err != nil {
			result.Error = fmt.Sprintf("Migration execution failed: %v", err)
			results = append(results, result)
			return filepath.SkipDir
		}

		if resultIsEmpty || resultPlugin == nil {
			result.Error = "Migration resulted in ignored or nil result"
			results = append(results, result)
			return filepath.SkipDir
		}

		// Convert back to map for comparison
		resultValue := map[string]interface{}{
			"kind": resultPlugin.Kind,
			"spec": resultPlugin.Spec,
		}
		actualBytes, _ := json.Marshal(resultValue)

		// Compare JSON outputs (normalized)
		var actualNormalized, expectedNormalized interface{}
		json.Unmarshal(actualBytes, &actualNormalized)
		json.Unmarshal(expectedData, &expectedNormalized)

		actualNormalizedBytes, _ := json.Marshal(actualNormalized)
		expectedNormalizedBytes, _ := json.Marshal(expectedNormalized)

		if string(actualNormalizedBytes) == string(expectedNormalizedBytes) {
			result.Success = true
		} else {
			result.Error = fmt.Sprintf("Migration output mismatch.\nExpected: %s\nActual: %s",
				string(expectedNormalizedBytes), string(actualNormalizedBytes))
		}

		results = append(results, result)
		return filepath.SkipDir
	})
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "test-schemas",
		Short: "Run tests for plugin schemas",
		Long: `Run tests for the plugin schemas, validating:
- CUE model schema validation tests
- CUE migration schema tests

Test files are placed directly alongside the CUE files they're testing, within a "tests" folder.

Supported test types:

1. **Model Valid Tests**:
  - Validate that a configuration is accepted by the plugin's CUE schema.
  - Place valid tests under "tests/valid/". "tests" is located next to the entrypoint of the "model" CUE package.
  - Each test is a JSON file containing a valid configuration expected to pass validation.

2. **Model Invalid Tests**:
  - Validate that a configuration is rejected by the plugin's CUE schema.
  - Place invalid tests in "tests/invalid/". "tests" is located next to the entrypoint of the "model" CUE package.
  - Each test is a JSON file containing an invalid configuration expected to fail validation.

3. **Migration Tests**:
  - Validate migration logic defined in the plugin's "migrate.cue" file.
  - Place migration tests under "migrate/tests/". "tests" is located next to "migrate.cue".
  - Each test is a directory containing:
    - "input.json": The source configuration (e.g., Grafana format).
    - "expected.json": The expected result after migration (Perses format).
  - The migration test unifies the input with the migration schema and compares the result to the expected output.

Example of file structure for a single plugin:
  schemas/
  ├── model.cue
  ├── tests/
  │   ├── valid/
  │   │   ├── basic-config.json
  │   │   └── advanced-config.json
  │   └── invalid/
  │       ├── missing-required.json
  │       └── invalid-type.json
  └── migrate/
      ├── migrate.cue
      └── tests/
          ├── basic-migration/
          │   ├── input.json
          │   └── expected.json
          └── complex-migration/
              ├── input.json
              └── expected.json

More complex example for a package embedding several plugins:
  schemas/
  ├── my-datasource/
  │   ├── model.cue
  │   ├── tests/
  │   │   ├── valid/
  │   │   │   ├── basic-config.json
  │   │   │   └── advanced-config.json
  │   │   └── invalid/
  │   │       ├── missing-required.json
  │   │       └── invalid-type.json
  │   └── migrate/
  │       ├── migrate.cue
  │       └── tests/
  │           ├── basic-migration/
  │           │   ├── input.json
  │           │   └── expected.json
  │           └── complex-migration/
  │               ├── input.json
  │               └── expected.json
  └── my-query/
      ├── model.cue
      ├── tests/
      │   ├── valid/
      │   └── invalid/
      └── migrate/
          ├── migrate.cue
          └── tests/`,
		Example: `
# Run schema tests for a plugin
$ percli plugin test-schemas --plugin.path ./my-plugin

# Run in current directory
$ percli plugin test-schemas`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.cfgPath, "config", "", "Relative path to the configuration file. It is relative, because it will use as a root path the one set with the flag --plugin.path. By default, the command will look for a file named 'perses_plugin_config.yaml'")
	cmd.Flags().StringVar(&o.pluginPath, "plugin.path", "", "Path to the plugin. By default, the command will look at the folder where the command is running.")

	return cmd
}
