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

package schematest

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/migrate"
	"github.com/perses/perses/internal/api/plugin/schema"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/cmd/plugin/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/model/api/v1/common"
	v1plugin "github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	cfg                config.PluginConfig
	cfgPath            string
	pluginPath         string
	relativeSchemaPath string
	writer             io.Writer
	errWriter          io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'plugin schema-test'")
	}
	cfg, err := config.Resolve(o.pluginPath, o.cfgPath)
	if err != nil {
		return fmt.Errorf("unable to resolve the configuration: %w", err)
	}
	o.cfg = cfg
	// Overriding the path with the plugin path
	o.cfg.DistPath = filepath.Join(o.pluginPath, o.cfg.DistPath)
	o.cfg.FrontendPath = filepath.Join(o.pluginPath, o.cfg.FrontendPath)
	o.relativeSchemaPath = o.cfg.SchemasPath
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
	if plugin.IsSchemaRequired(npmPackageData.Perses) {
		if _, err := os.Stat(filepath.Join(o.pluginPath, plugin.CuelangModuleFolder)); os.IsNotExist(err) {
			return fmt.Errorf("cue module not found in %s", filepath.Join(o.pluginPath, plugin.CuelangModuleFolder))
		}
		// There is a possibility the schema path set in package.json differ from the one set in the configuration.
		// In this case, we will use the one set in the configuration.
		npmPackageData.Perses.SchemasPath = o.relativeSchemaPath
		if _, err := schema.Load(o.pluginPath, npmPackageData.Perses); err != nil {
			return err
		}
		if _, err := migrate.Load(o.pluginPath, npmPackageData.Perses); err != nil {
			return err
		}

		// Run tests directly from the schemas directory
		if err := o.runSchemaTests(); err != nil {
			return err
		}
	} else {
		return output.HandleString(o.writer, "No schemas found in this plugin, nothing to test")
	}
	return nil
}

func (o *option) runSchemaTests() error {
	testRunner := NewTestRunner(o.pluginPath, "")
	results, err := testRunner.RunAllTests(o.cfg.SchemasPath)
	if err != nil {
		return fmt.Errorf("failed to run tests: %w", err)
	}

	if len(results) == 0 {
		return output.HandleString(o.writer, "No tests found")
	}

	// Report test results
	passed := 0
	failed := 0
	for _, result := range results {
		if result.Success {
			passed++
			fmt.Fprintf(o.writer, "✓ %s (%s)\n", result.TestName, result.TestType)
		} else {
			failed++
			fmt.Fprintf(o.writer, "✗ %s (%s): %s\n", result.TestName, result.TestType, result.Error)
		}
	}

	fmt.Fprintf(o.writer, "\nTest Results: %d passed, %d failed\n", passed, failed)

	if failed > 0 {
		return fmt.Errorf("%d test(s) failed", failed)
	}

	return output.HandleString(o.writer, "All schema tests passed")
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
		Use:   "schema-test",
		Short: "Run tests for plugin schemas",
		Long: `Run tests for the plugin schemas, validating:
- CUE model schema validation tests
- CUE migration schema tests

Test files are placed directly alongside the CUE files they're testing:

Testing structure:
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
          └── tests/

Or with a flattened structure:
  schemas/
  ├── my-panel.cue
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
              └── expected.json`,
		Example: `
# Run schema tests for a plugin
$ percli plugin schema-test --plugin.path ./my-plugin

# Run in current directory
$ percli plugin schema-test`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.cfgPath, "config", "", "Relative path to the configuration file. It is relative, because it will use as a root path the one set with the flag --plugin.path. By default, the command will look for a file named 'perses_plugin_config.yaml'")
	cmd.Flags().StringVar(&o.pluginPath, "plugin.path", "", "Path to the plugin. By default, the command will look at the folder where the command is running.")

	return cmd
}

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
	TestType TestType
	Success  bool
	Error    string
}

// TestRunner handles execution of plugin tests
type TestRunner struct {
	pluginPath  string
	testsPath   string
	schemas     map[string]*build.Instance
	migrations  map[string]*build.Instance
	packageData *plugin.NPMPackage
}

// NewTestRunner creates a new test runner
func NewTestRunner(pluginPath, testsPath string) *TestRunner {
	return &TestRunner{
		pluginPath: pluginPath,
		testsPath:  testsPath,
		schemas:    make(map[string]*build.Instance),
		migrations: make(map[string]*build.Instance),
	}
}

// loadPackageData loads and caches the package.json data
func (tr *TestRunner) loadPackageData() error {
	if tr.packageData != nil {
		return nil
	}

	var err error
	tr.packageData, err = plugin.ReadPackage(tr.pluginPath)
	if err != nil {
		return err
	}

	return nil
}

// getPluginKindMapping returns the CUE definition ID and type based on plugin kind
func (tr *TestRunner) getPluginKindMapping(pluginKind string) (defID, typeOfData string, err error) {
	if err := tr.loadPackageData(); err != nil {
		return "", "", fmt.Errorf("failed to load package.json: %w", err)
	}

	// Find the plugin in the package.json that matches the expected kind
	for _, pluginSpec := range tr.packageData.Perses.Plugins {
		// Try different matching strategies
		kindName := strings.ToLower(string(pluginSpec.Kind))
		specName := strings.ToLower(pluginSpec.Spec.Name)
		testKind := strings.ToLower(pluginKind)

		if strings.Contains(testKind, kindName) || strings.Contains(kindName, testKind) ||
			strings.Contains(testKind, specName) || strings.Contains(specName, testKind) ||
			testKind == kindName || testKind == specName {

			// Now determine what kind of plugin it is
			switch pluginSpec.Kind {
			case "Panel":
				return "#panel", "panel", nil
			case "Variable":
				return "#var", "variable", nil
			default:
				// Check if it's a query type (ends with "Query")
				if strings.HasSuffix(string(pluginSpec.Kind), "Query") {
					return "#target", "query", nil
				}
				return "", "", fmt.Errorf("unsupported plugin kind: %s", pluginSpec.Kind)
			}
		}
	}

	// If we can't match to a plugin in package.json, make a best guess based on the name
	lowerKind := strings.ToLower(pluginKind)
	if strings.Contains(lowerKind, "panel") {
		return "#panel", "panel", nil
	} else if strings.Contains(lowerKind, "var") || strings.Contains(lowerKind, "variable") {
		return "#var", "variable", nil
	} else if strings.Contains(lowerKind, "query") {
		return "#target", "query", nil
	}

	return "", "", fmt.Errorf("plugin %s not found in package.json and could not be identified by name", pluginKind)
}

func (tr *TestRunner) LoadModelSchemas(schemasPath string) error {
	return filepath.WalkDir(schemasPath, func(currentPath string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if d.Name() == "migrate" {
				return filepath.SkipDir
			}
			return nil
		}
		if filepath.Ext(currentPath) != ".cue" {
			return nil
		}

		// Check if it's a model package
		data, err := os.ReadFile(currentPath)
		if err != nil {
			return err
		}
		if !strings.Contains(string(data), "package model") {
			return nil
		}

		currentDir, _ := filepath.Split(currentPath)
		logrus.Tracef("Loading model schema from %s", currentDir)

		kind, instance, err := schema.LoadModelSchema(currentDir)
		if err != nil {
			return err
		}

		logrus.Debugf("Loaded model schema for kind %s", kind)
		tr.schemas[kind] = instance
		return filepath.SkipDir
	})
}

func (tr *TestRunner) LoadMigrationSchemas(schemasPath string) error {
	// Ensure we have package data loaded
	if err := tr.loadPackageData(); err != nil {
		return fmt.Errorf("failed to load package.json: %w", err)
	}

	// Use the migrate package's function to load the schemas
	// We need to pass the parent directory of schemasPath as pluginPath
	pluginPath := filepath.Dir(schemasPath)
	schemas, err := migrate.Load(pluginPath, v1plugin.ModuleSpec{
		SchemasPath: filepath.Base(schemasPath),
	})
	if err != nil {
		return err
	}

	// Process the loaded schemas
	for _, schema := range schemas {
		logrus.Debugf("Loaded migration schema for plugin kind: %s, path: %s", schema.Kind, schema.Name)

		// Store the schema with different keys to maximize chances of finding it

		// 1. Store with the official kind from migrate.Load
		tr.migrations[string(schema.Kind)] = schema.Instance

		// 2. Extract directory name for matching by directory
		pathParts := strings.Split(schema.Name, string(filepath.Separator))
		if len(pathParts) >= 2 {
			// The plugin directory is the directory above "migrate"
			pluginDirName := pathParts[len(pathParts)-2]
			tr.migrations[pluginDirName] = schema.Instance
		}

		// 3. Find all related plugin kinds/names in package.json and store with those
		for _, pluginSpec := range tr.packageData.Perses.Plugins {
			// If this plugin spec kind matches the schema kind
			if strings.EqualFold(string(pluginSpec.Kind), string(schema.Kind)) {
				// Also store with the plugin name from package.json
				tr.migrations[pluginSpec.Spec.Name] = schema.Instance
			}
		}
	}

	return nil
}

// RunModelTests runs all model validation tests
func (tr *TestRunner) RunModelTests() ([]TestResult, error) {
	var results []TestResult

	// Check for tests alongside schema files
	if err := tr.loadPackageData(); err != nil {
		return nil, fmt.Errorf("failed to load package.json: %w", err)
	}

	schemasPath := filepath.Join(tr.pluginPath, tr.packageData.Perses.SchemasPath)

	// First check if tests are directly in the schemas path (flattened structure)
	rootTestsPath := filepath.Join(schemasPath, "tests")
	if _, err := os.Stat(rootTestsPath); err == nil {
		logrus.Debugf("Found tests directory at root level: %s", rootTestsPath)

		// Valid tests
		validPath := filepath.Join(rootTestsPath, "valid")
		if _, err := os.Stat(validPath); err == nil {
			logrus.Debugf("Found valid tests at root level")
			validResults, err := tr.runModelValidationTests(validPath, true)
			if err != nil {
				return nil, err
			}
			if len(validResults) > 0 {
				logrus.Debugf("Processed %d valid tests at root level", len(validResults))
				results = append(results, validResults...)
			}
		}

		// Invalid tests
		invalidPath := filepath.Join(rootTestsPath, "invalid")
		if _, err := os.Stat(invalidPath); err == nil {
			logrus.Debugf("Found invalid tests at root level")
			invalidResults, err := tr.runModelValidationTests(invalidPath, false)
			if err != nil {
				return nil, err
			}
			if len(invalidResults) > 0 {
				logrus.Debugf("Processed %d invalid tests at root level", len(invalidResults))
				results = append(results, invalidResults...)
			}
		}

		// If we found any tests at the root level, return them
		if len(results) > 0 {
			return results, nil
		}
	}

	// If no tests at root level, try the hierarchical structure
	// Find tests next to schema files
	for kind := range tr.schemas {
		// Try to find the corresponding directory for this plugin kind
		kindDir := ""
		entries, err := os.ReadDir(schemasPath)
		if err == nil {
			for _, entry := range entries {
				if entry.IsDir() {
					// Look inside each top-level directory to find potential plugin subdirectories
					subEntries, subErr := os.ReadDir(filepath.Join(schemasPath, entry.Name()))
					if subErr == nil {
						for _, subEntry := range subEntries {
							if subEntry.IsDir() {
								// Check if this subdirectory matches the plugin kind
								subDirName := strings.ToLower(subEntry.Name())
								kindName := strings.ToLower(kind)

								// Try different matching strategies
								if subDirName == kindName ||
									strings.Contains(subDirName, kindName) ||
									strings.Contains(kindName, subDirName) ||
									strings.ReplaceAll(subDirName, "-", "") == strings.ReplaceAll(kindName, "-", "") {
									kindDir = filepath.Join(entry.Name(), subEntry.Name())
									break
								}
							}
						}
						if kindDir != "" {
							break
						}
					}

					// Also check the top-level directory as before
					dirName := strings.ToLower(entry.Name())
					kindName := strings.ToLower(kind)

					// Try different matching strategies
					if dirName == kindName ||
						strings.Contains(dirName, kindName) ||
						strings.Contains(kindName, dirName) ||
						strings.ReplaceAll(dirName, "-", "") == strings.ReplaceAll(kindName, "-", "") {
						kindDir = entry.Name()
						break
					}
				}
			}
		}

		if kindDir != "" {
			kindPath := filepath.Join(schemasPath, kindDir)
			logrus.Debugf("Found directory for plugin kind %s at %s", kind, kindPath)

			// Test valid cases
			validPath := filepath.Join(kindPath, "tests", "valid")
			if _, err := os.Stat(validPath); err == nil {
				logrus.Debugf("Found valid tests for %s at %s", kind, validPath)
				validResults, err := tr.runModelValidationTests(validPath, true)
				if err != nil {
					return nil, err
				}
				if len(validResults) > 0 {
					logrus.Debugf("Processed %d valid tests for %s", len(validResults), kind)
					results = append(results, validResults...)
				}
			}

			// Test invalid cases
			invalidPath := filepath.Join(kindPath, "tests", "invalid")
			if _, err := os.Stat(invalidPath); err == nil {
				logrus.Debugf("Found invalid tests for %s at %s", kind, invalidPath)
				invalidResults, err := tr.runModelValidationTests(invalidPath, false)
				if err != nil {
					return nil, err
				}
				if len(invalidResults) > 0 {
					logrus.Debugf("Processed %d invalid tests for %s", len(invalidResults), kind)
					results = append(results, invalidResults...)
				}
			}
		} else {
			logrus.Debugf("Could not find directory for plugin kind: %s", kind)
		}
	}

	return results, nil
}

// runModelValidationTests runs validation tests for a specific directory
func (tr *TestRunner) runModelValidationTests(testDir string, shouldBeValid bool) ([]TestResult, error) {
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
		result := TestResult{
			TestName: testName,
			TestType: map[bool]TestType{true: TestTypeModelValid, false: TestTypeModelInvalid}[shouldBeValid],
		}

		// Read test data
		data, err := os.ReadFile(currentPath)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to read test file: %v", err)
			results = append(results, result)
			return nil
		}

		// Parse the plugin from JSON
		var plugin common.Plugin
		if err := json.Unmarshal(data, &plugin); err != nil {
			result.Error = fmt.Sprintf("Failed to parse JSON: %v", err)
			results = append(results, result)
			return nil
		}

		// Find the appropriate schema
		schemaInstance, exists := tr.schemas[plugin.Kind]
		if !exists {
			result.Error = fmt.Sprintf("No schema found for plugin kind: %s", plugin.Kind)
			results = append(results, result)
			return nil
		}

		// Validate the plugin against the schema
		ctx := cuecontext.New()
		pluginValue := ctx.CompileBytes(data)
		finalValue := pluginValue.Unify(ctx.BuildInstance(schemaInstance))

		validationOptions := []cue.Option{
			cue.Concrete(true),
			cue.Attributes(true),
			cue.Definitions(true),
			cue.Hidden(true),
		}
		validationErr := finalValue.Validate(validationOptions...)
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

// RunMigrationTests runs all migration tests
func (tr *TestRunner) RunMigrationTests() ([]TestResult, error) {
	var results []TestResult

	// Check for tests alongside migration files
	if err := tr.loadPackageData(); err != nil {
		return nil, fmt.Errorf("failed to load package.json: %w", err)
	}

	schemasPath := filepath.Join(tr.pluginPath, tr.packageData.Perses.SchemasPath)

	// First check for a migrate directory directly in the schemas path (flattened structure)
	rootMigratePath := filepath.Join(schemasPath, "migrate")
	if _, err := os.Stat(rootMigratePath); err == nil {
		migrateTestsPath := filepath.Join(rootMigratePath, "tests")
		if _, err := os.Stat(migrateTestsPath); err == nil {
			logrus.Debugf("Found migration tests at root level: %s", migrateTestsPath)

			// Try to determine the plugin kind from package.json
			pluginKind := ""
			if len(tr.packageData.Perses.Plugins) > 0 {
				// Use the first plugin in the package.json
				pluginKind = tr.packageData.Perses.Plugins[0].Spec.Name
			}

			if pluginKind == "" {
				// Extract from a migration file if possible
				files, err := os.ReadDir(rootMigratePath)
				if err == nil {
					for _, file := range files {
						if !file.IsDir() && strings.HasSuffix(file.Name(), ".cue") {
							data, err := os.ReadFile(filepath.Join(rootMigratePath, file.Name()))
							if err == nil {
								fileContent := string(data)
								kindMatch := regexp.MustCompile(`kind:\s*"([^"]+)"`).FindStringSubmatch(fileContent)
								if len(kindMatch) > 1 {
									pluginKind = kindMatch[1]
									break
								}
							}
						}
					}
				}
			}

			if pluginKind == "" {
				// If still no kind, use the parent directory name
				parentDir := filepath.Base(tr.pluginPath)
				pluginKind = parentDir
			}

			logrus.Debugf("Running migration tests with plugin kind: %s", pluginKind)
			migrateResults, err := tr.runMigrationTestsForPath(migrateTestsPath, pluginKind)
			if err != nil {
				return nil, err
			}
			results = append(results, migrateResults...)

			// If we found tests at the root level, return them
			if len(results) > 0 {
				return results, nil
			}
		}
	}

	// If no tests at root level, try the hierarchical structure
	// Look through all directories in the schemas path
	entries, err := os.ReadDir(schemasPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read schemas directory: %w", err)
	}

	// Check each plugin directory for migration tests
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		// First check if this top directory has a migrate folder
		migratePath := filepath.Join(schemasPath, entry.Name(), "migrate")
		migrateTestsPath := filepath.Join(migratePath, "tests")

		if _, err := os.Stat(migratePath); err == nil {
			if _, err := os.Stat(migrateTestsPath); err == nil {
				logrus.Debugf("Found migration tests for plugin directory: %s", entry.Name())

				// Determine the plugin kind from the package.json if possible
				pluginKind := ""
				for _, pluginSpec := range tr.packageData.Perses.Plugins {
					// Try different matching strategies
					dirName := strings.ToLower(entry.Name())
					kindName := strings.ToLower(string(pluginSpec.Kind))
					specName := strings.ToLower(pluginSpec.Spec.Name)

					if strings.Contains(dirName, kindName) || strings.Contains(kindName, dirName) ||
						strings.Contains(dirName, specName) || strings.Contains(specName, dirName) {
						pluginKind = pluginSpec.Spec.Name
						break
					}
				}

				if pluginKind == "" {
					// If we can't match to a plugin in package.json, use the directory name
					pluginKind = entry.Name()
				}

				logrus.Debugf("Running migration tests for plugin: %s (dir: %s)", pluginKind, entry.Name())

				// Run the tests for this plugin
				migrateResults, err := tr.runMigrationTestsForPath(migrateTestsPath, pluginKind)
				if err != nil {
					return nil, err
				}
				results = append(results, migrateResults...)
			}
		}

		// Now check for subdirectories that might have migrate folders
		subEntries, subErr := os.ReadDir(filepath.Join(schemasPath, entry.Name()))
		if subErr == nil {
			for _, subEntry := range subEntries {
				if !subEntry.IsDir() {
					continue
				}

				migratePath := filepath.Join(schemasPath, entry.Name(), subEntry.Name(), "migrate")
				migrateTestsPath := filepath.Join(migratePath, "tests")

				if _, err := os.Stat(migratePath); err == nil {
					if _, err := os.Stat(migrateTestsPath); err == nil {
						logrus.Debugf("Found migration tests for plugin directory: %s/%s", entry.Name(), subEntry.Name())

						// Determine the plugin kind from the package.json if possible
						pluginKind := ""
						for _, pluginSpec := range tr.packageData.Perses.Plugins {
							// Try different matching strategies
							dirName := strings.ToLower(subEntry.Name())
							kindName := strings.ToLower(string(pluginSpec.Kind))
							specName := strings.ToLower(pluginSpec.Spec.Name)

							if strings.Contains(dirName, kindName) || strings.Contains(kindName, dirName) ||
								strings.Contains(dirName, specName) || strings.Contains(specName, dirName) {
								pluginKind = pluginSpec.Spec.Name
								break
							}
						}

						if pluginKind == "" {
							// If we can't match to a plugin in package.json, use the directory name
							pluginKind = subEntry.Name()
						}

						logrus.Debugf("Running migration tests for plugin: %s (dir: %s/%s)", pluginKind, entry.Name(), subEntry.Name())

						// Run the tests for this plugin
						migrateResults, err := tr.runMigrationTestsForPath(migrateTestsPath, pluginKind)
						if err != nil {
							return nil, err
						}
						results = append(results, migrateResults...)
					}
				}
			}
		}
	}

	return results, nil
}

// RunAllTests runs both model and migration tests
func (tr *TestRunner) RunAllTests(schemasPath string) ([]TestResult, error) {
	// Load schemas and migrations
	if err := tr.LoadModelSchemas(schemasPath); err != nil {
		return nil, fmt.Errorf("failed to load schemas: %w", err)
	}

	if err := tr.LoadMigrationSchemas(schemasPath); err != nil {
		return nil, fmt.Errorf("failed to load migrations: %w", err)
	}

	var allResults []TestResult

	// Run model tests
	modelResults, err := tr.RunModelTests()
	if err != nil {
		return nil, fmt.Errorf("failed to run model tests: %w", err)
	}
	allResults = append(allResults, modelResults...)

	// Run migration tests
	migrationResults, err := tr.RunMigrationTests()
	if err != nil {
		return nil, fmt.Errorf("failed to run migration tests: %w", err)
	}
	allResults = append(allResults, migrationResults...)

	return allResults, nil
}

// runMigrationTestsForPath runs migration tests for a specific directory path
func (tr *TestRunner) runMigrationTestsForPath(testDir string, explicitPluginName string) ([]TestResult, error) {
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
		result := TestResult{
			TestName: testName,
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

		// Determine the plugin name - either use the explicitly provided one or extract from expected.json
		var pluginKind string
		if explicitPluginName != "" {
			pluginKind = explicitPluginName
		} else {
			// Parse expected output to determine plugin kind
			var expectedPlugin common.Plugin
			if err := json.Unmarshal(expectedData, &expectedPlugin); err != nil {
				result.Error = fmt.Sprintf("Failed to parse expected.json: %v", err)
				results = append(results, result)
				return filepath.SkipDir
			}
			pluginKind = expectedPlugin.Kind
		}

		logrus.Debugf("Migration test for plugin kind: %s", pluginKind)

		// Find the appropriate migration - try to match with any of our loaded migrations
		var migrationInstance *build.Instance
		var foundKey string

		// First try exact match
		if instance, exists := tr.migrations[pluginKind]; exists {
			migrationInstance = instance
			foundKey = pluginKind
		} else {
			// If no exact match, try case-insensitive match
			pluginKindLower := strings.ToLower(pluginKind)
			for key, instance := range tr.migrations {
				if strings.ToLower(key) == pluginKindLower {
					migrationInstance = instance
					foundKey = key
					break
				}
			}

			// If still no match, try more flexible matching
			if migrationInstance == nil {
				for key, instance := range tr.migrations {
					keyLower := strings.ToLower(key)
					if strings.Contains(keyLower, pluginKindLower) ||
						strings.Contains(pluginKindLower, keyLower) {
						migrationInstance = instance
						foundKey = key
						break
					}
				}
			}
		}

		if migrationInstance == nil {
			result.Error = fmt.Sprintf("No migration found for plugin: %s", pluginKind)
			results = append(results, result)
			return filepath.SkipDir
		}

		logrus.Debugf("Found migration logic for plugin key: %s", foundKey)

		// Get the correct definition ID and type based on plugin kind
		defID, typeOfData, err := tr.getPluginKindMapping(pluginKind)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to determine plugin mapping: %v", err)
			results = append(results, result)
			return filepath.SkipDir
		}

		// Execute the migration logic
		resultPlugin, resultIsEmpty, err := migrate.ExecuteCuelangMigrationScript(migrationInstance, inputData, defID, typeOfData)
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
