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

package lint

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	apiCue "github.com/perses/perses/internal/api/cue"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/cli/file"
	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// testSchema is a small dashboard schema shaped like the one served by /api/v1/schemas/dashboards,
// with a disjunction of two panel plugins.
const testSchema = `
#Plugin_Panel_Chart: {
	kind: "Chart"
	spec: close({
		unit?: "bytes" | "seconds" | "percent"
	})
}
#Plugin_Panel_Markdown: {
	kind: "Markdown"
	spec: close({
		text: string
	})
}
#Dashboard: {
	kind: "Dashboard"
	metadata: {
		name:     string
		project?: string
	}
	spec: close({
		duration: string
		panels: [string]: {
			kind: "Panel"
			spec: close({
				plugin: {
					kind: #Plugin_Panel_Chart.kind
					spec: #Plugin_Panel_Chart.spec
				} | {
					kind: #Plugin_Panel_Markdown.kind
					spec: #Plugin_Panel_Markdown.spec
				}
			})
		}
	})
}
`

func writeFile(t *testing.T, dir, name, content string) string {
	t.Helper()
	path := filepath.Join(dir, name)
	require.NoError(t, os.WriteFile(path, []byte(content), 0600))
	return path
}

func newTestDashboard(plugin map[string]any) map[string]any {
	return map[string]any{
		"kind":     "Dashboard",
		"metadata": map[string]any{"name": "demo", "project": "perses"},
		"spec": map[string]any{
			"duration": "1h",
			"panels": map[string]any{
				"cpu": map[string]any{"kind": "Panel", "spec": map[string]any{"plugin": plugin}},
			},
		},
	}
}

// withOSPaths uses the path separator of the OS in the positions of the expected CUE errors (e.g. .\dashboard.json on Windows).
func withOSPaths(expected string) string {
	lines := strings.Split(expected, "\n")
	for i, line := range lines {
		if strings.HasPrefix(line, "    ./") {
			lines[i] = filepath.FromSlash(line)
		}
	}
	return strings.Join(lines, "\n")
}

func toJSON(t *testing.T, object any) string {
	t.Helper()
	data, err := json.Marshal(object)
	require.NoError(t, err)
	return string(data)
}

func TestDashboardSchemaValidate(t *testing.T) {
	dir := t.TempDir()
	// The positions in the CUE errors are relative to the current directory.
	t.Chdir(dir)
	sch, err := loadDashboardSchema(writeFile(t, dir, "schema.cue", testSchema))
	require.NoError(t, err)

	misspelled := newTestDashboard(map[string]any{"kind": "Markdown", "spec": map[string]any{"text": "x"}})
	misspelled["spec"].(map[string]any)["durration"] = "6h"

	testSuites := []struct {
		title    string
		fileName string
		content  string
		expected string
	}{
		{
			title:    "valid dashboard",
			fileName: "dashboard.json",
			content:  toJSON(t, newTestDashboard(map[string]any{"kind": "Chart", "spec": map[string]any{"unit": "bytes"}})),
		},
		{
			title:    "misspelled field outside the plugins",
			fileName: "dashboard.json",
			content:  toJSON(t, misspelled),
			expected: `invalid dashboard "demo": #Dashboard.spec.durration: field not allowed:
    ./dashboard.json:1:92`,
		},
		{
			title:    "invalid value in a plugin",
			fileName: "dashboard.json",
			content:  toJSON(t, newTestDashboard(map[string]any{"kind": "Chart", "spec": map[string]any{"unit": "ops"}})),
			expected: `invalid dashboard "demo": #Dashboard.spec.panels.cpu.spec.plugin: 5 errors in empty disjunction:
#Dashboard.spec.panels.cpu.spec.plugin.kind: conflicting values "Markdown" and "Chart":
    ./dashboard.json:1:148
    ./schema.cue:9:8
    ./schema.cue:29:12
#Dashboard.spec.panels.cpu.spec.plugin.spec.unit: 3 errors in empty disjunction:
#Dashboard.spec.panels.cpu.spec.plugin.spec.unit: conflicting values "bytes" and "ops":
    ./dashboard.json:1:171
    ./schema.cue:5:10
    ./schema.cue:27:12
#Dashboard.spec.panels.cpu.spec.plugin.spec.unit: conflicting values "percent" and "ops":
    ./dashboard.json:1:171
    ./schema.cue:5:32
    ./schema.cue:27:12
#Dashboard.spec.panels.cpu.spec.plugin.spec.unit: conflicting values "seconds" and "ops":
    ./dashboard.json:1:171
    ./schema.cue:5:20
    ./schema.cue:27:12`,
		},
		{
			title:    "unknown field in a plugin",
			fileName: "dashboard.json",
			content:  toJSON(t, newTestDashboard(map[string]any{"kind": "Markdown", "spec": map[string]any{"txt": "x"}})),
			expected: `invalid dashboard "demo": #Dashboard.spec.panels.cpu.spec.plugin: 2 errors in empty disjunction:
#Dashboard.spec.panels.cpu.spec.plugin.kind: conflicting values "Chart" and "Markdown":
    ./dashboard.json:1:148
    ./schema.cue:3:8
    ./schema.cue:26:12
#Dashboard.spec.panels.cpu.spec.plugin.spec.txt: field not allowed:
    ./dashboard.json:1:168`,
		},
		{
			title:    "unknown plugin",
			fileName: "dashboard.json",
			content:  toJSON(t, newTestDashboard(map[string]any{"kind": "Gauge", "spec": map[string]any{}})),
			expected: `invalid dashboard "demo": #Dashboard.spec.panels.cpu.spec.plugin: 2 errors in empty disjunction:
#Dashboard.spec.panels.cpu.spec.plugin.kind: conflicting values "Chart" and "Gauge":
    ./dashboard.json:1:148
    ./schema.cue:3:8
    ./schema.cue:26:12
#Dashboard.spec.panels.cpu.spec.plugin.kind: conflicting values "Markdown" and "Gauge":
    ./dashboard.json:1:148
    ./schema.cue:9:8
    ./schema.cue:29:12`,
		},
		{
			title:    "list of resources in a JSON file",
			fileName: "resources.json",
			content: toJSON(t, []any{
				map[string]any{"kind": "Project", "metadata": map[string]any{"name": "perses"}},
				misspelled,
			}),
			expected: `invalid dashboard "demo": #Dashboard.spec.durration: field not allowed:
    ./resources.json:1:141`,
		},
		{
			title:    "several YAML documents with a numeric panel key",
			fileName: "resources.yaml",
			content: `kind: Project
metadata:
  name: perses
---
kind: Dashboard
metadata:
  name: demo
  project: perses
spec:
  duration: 1h
  panels:
    0:
      kind: Panel
      spec:
        plugin:
          kind: Markdown
          spec:
            txt: x
`,
			expected: `invalid dashboard "demo": #Dashboard.spec.panels."0".spec.plugin: 2 errors in empty disjunction:
#Dashboard.spec.panels."0".spec.plugin.kind: conflicting values "Chart" and "Markdown":
    ./resources.yaml:16:17
    ./schema.cue:3:8
    ./schema.cue:26:12
#Dashboard.spec.panels."0".spec.plugin.spec.txt: field not allowed:
    ./resources.yaml:18:13`,
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			path := writeFile(t, dir, test.fileName, test.content)
			data, isJSON, err := file.Read(path)
			require.NoError(t, err)
			invalidDashboards, err := sch.validate(path, data, isJSON)
			require.NoError(t, err)
			if len(test.expected) == 0 {
				assert.Empty(t, invalidDashboards)
				return
			}
			require.Len(t, invalidDashboards, 1)
			got := fmt.Sprintf("invalid dashboard %q: %s", invalidDashboards[0].name, invalidDashboards[0].err)
			assert.Equal(t, withOSPaths(test.expected), got)
		})
	}
}

func TestLoadDashboardSchemaWithoutDashboard(t *testing.T) {
	path := writeFile(t, t.TempDir(), "schema.cue", "#Foo: string\n")
	_, err := loadDashboardSchema(path)
	assert.EqualError(t, err, fmt.Sprintf("the schema %q doesn't define #Dashboard", path))
}

// TestLintCMDWithSchema uses the schema generated by Perses when no plugin is loaded.
func TestLintCMDWithSchema(t *testing.T) {
	value, err := schema.New().GenerateDashboardSchema()
	require.NoError(t, err)
	data, err := apiCue.Marshal(value)
	require.NoError(t, err)
	dir := t.TempDir()
	// The positions in the CUE errors are relative to the current directory.
	t.Chdir(dir)
	schemaPath := writeFile(t, dir, "schema.cue", string(data))
	valid := writeFile(t, dir, "valid.json", `{"kind":"Dashboard","metadata":{"name":"demo","project":"perses"},"spec":{"display":{"name":"demo"},"duration":"6h","layouts":[],"panels":{}}}`)
	invalidDir := filepath.Join(dir, "invalid")
	require.NoError(t, os.Mkdir(invalidDir, 0o700))
	writeFile(t, invalidDir, "first.json", `{"kind":"Dashboard","metadata":{"name":"first","project":"perses"},"spec":{"display":{"name":"first"},"durration":"6h","layouts":[],"panels":{}}}`)
	writeFile(t, invalidDir, "second.json", `{"kind":"Dashboard","metadata":{"name":"second","project":"perses"},"spec":{"dispaly":{"name":"second"},"duration":"6h","layouts":[],"panels":{}}}`)
	misspelled := writeFile(t, dir, "misspelled.json", `{"kind":"Dashboard","metadata":{"name":"demo","project":"perses"},"spec":{"display":{"name":"demo"},"durration":"6h","layouts":[],"panels":{}}}`)
	// The panel key is an unquoted number, which the YAML decoder doesn't decode as a string key.
	numericKey := writeFile(t, dir, "numeric-key.yaml", `kind: Dashboard
metadata:
  name: demo
  project: perses
spec:
  display:
    name: demo
  duration: 6h
  layouts: []
  panels:
    0:
      kind: Panel
      spec:
        display:
          name: panel
        plugin:
          kind: Unknown
          spec: {}
`)

	// The other resources only get the checks that don't need the plugin schemas.
	otherResources := writeFile(t, dir, "other-resources.json", `[
		{"kind":"GlobalVariable","metadata":{"name":"env"},"spec":{"kind":"TextVariable","spec":{"name":"env","value":"prod"}}},
		{"kind":"Variable","metadata":{"name":"region","project":"perses"},"spec":{"kind":"TextVariable","spec":{"name":"region","value":"eu"}}},
		{"kind":"GlobalDatasource","metadata":{"name":"prom"},"spec":{"default":true,"plugin":{"kind":"PrometheusDatasource","spec":{}}}}
	]`)
	invalidVariable := writeFile(t, dir, "invalid-variable.json", `{"kind":"GlobalVariable","metadata":{"name":"123"},"spec":{"kind":"TextVariable","spec":{"name":"123","value":"prod"}}}`)

	cmdTest.ExecuteSuiteTest(t, NewCMD, []cmdTest.Suite{
		{
			Title:           "other resources",
			Args:            []string{"-f", otherResources, "--schema", schemaPath},
			ExpectedMessage: "your resources look good\n",
		},
		{
			Title:           "variable with an invalid name",
			Args:            []string{"-f", invalidVariable, "--schema", schemaPath},
			IsErrorExpected: true,
			ExpectedMessage: fmt.Sprintf("1 invalid resource(s) found:\n- GlobalVariable \"123\" (file %q): variable name '123' is not valid", invalidVariable),
		},
		{
			Title:           "valid dashboard",
			Args:            []string{"-f", valid, "--schema", schemaPath},
			ExpectedMessage: "your resources look good\n",
		},
		{
			Title:           "yaml dashboard with a numeric panel key",
			Args:            []string{"-f", numericKey, "--schema", schemaPath},
			ExpectedMessage: "your resources look good\n",
		},
		{
			Title:           "misspelled field",
			Args:            []string{"-f", misspelled, "--schema", schemaPath},
			IsErrorExpected: true,
			ExpectedMessage: fmt.Sprintf("1 invalid resource(s) found:\n- Dashboard \"perses/demo\" (file %q): ", misspelled) +
				withOSPaths(`#Dashboard.spec.durration: field not allowed:
    ./misspelled.json:1:102`),
		},
		{
			Title:           "every invalid dashboard of a directory is reported",
			Args:            []string{"-d", invalidDir, "--schema", schemaPath},
			IsErrorExpected: true,
			ExpectedMessage: "2 invalid resource(s) found:\n" +
				fmt.Sprintf("- Dashboard \"perses/first\" (file %q): ", filepath.Join(invalidDir, "first.json")) +
				withOSPaths("#Dashboard.spec.durration: field not allowed:\n    ./invalid/first.json:1:104") + "\n" +
				fmt.Sprintf("- Dashboard \"perses/second\" (file %q): ", filepath.Join(invalidDir, "second.json")) +
				withOSPaths("#Dashboard.spec.dispaly: field not allowed:\n    ./invalid/second.json:1:78"),
		},
		{
			Title:           "schema and online are mutually exclusive",
			Args:            []string{"-f", valid, "--schema", schemaPath, "--online"},
			IsErrorExpected: true,
			ExpectedMessage: "if any flags in the group [schema online] are set none of the others can be; [online schema] were all set",
		},
		{
			Title:                "schema file not found",
			Args:                 []string{"-f", valid, "--schema", filepath.Join(dir, "missing.cue")},
			IsErrorExpected:      true,
			ExpectedRegexMessage: `missing\.cue: (no such file or directory|The system cannot find the file specified)`,
		},
	})
}

// TestLintCMDWithSchemaConsistency verifies the consistency checks that don't depend on the plugin schemas still run with --schema.
func TestLintCMDWithSchemaConsistency(t *testing.T) {
	dir := t.TempDir()
	// The positions in the CUE errors are relative to the current directory.
	t.Chdir(dir)
	schemaPath := writeFile(t, dir, "schema.cue", `
#Dashboard: {
	kind: "Dashboard"
	metadata: {
		name:     string
		project?: string
	}
	spec: close({
		display?: name: string
		duration: string
		layouts: [...]
		panels: {}
		datasources?: [string]: close({
			default: bool
			plugin: {
				kind: "PrometheusDatasource"
				spec: {}
			}
		})
	})
}
`)
	dashboardWithDatasources := func(secondDefault bool) string {
		return fmt.Sprintf(`{"kind":"Dashboard","metadata":{"name":"demo","project":"perses"},"spec":{"display":{"name":"demo"},"duration":"6h","layouts":[],"panels":{},"datasources":{"a":{"default":true,"plugin":{"kind":"PrometheusDatasource","spec":{}}},"b":{"default":%t,"plugin":{"kind":"PrometheusDatasource","spec":{}}}}}}`, secondDefault)
	}
	oneDefault := writeFile(t, dir, "one-default.json", dashboardWithDatasources(false))
	twoDefaults := writeFile(t, dir, "two-defaults.json", dashboardWithDatasources(true))
	// The first dashboard doesn't match the schema, and the second one has the same name but fails the consistency checks.
	sameName := writeFile(t, dir, "same-name.json", `[{"kind":"Dashboard","metadata":{"name":"demo","project":"perses"},"spec":{"display":{"name":"demo"},"durration":"6h","layouts":[],"panels":{}}},`+dashboardWithDatasources(true)+`]`)
	noSpec := writeFile(t, dir, "no-spec.json", `{"kind":"Dashboard","metadata":{"name":"demo","project":"perses"}}`)
	// The item that is not an object doesn't prevent the other resources from being checked.
	nonObject := writeFile(t, dir, "non-object.json", `[`+dashboardWithDatasources(false)+`,42,`+dashboardWithDatasources(true)+`]`)

	cmdTest.ExecuteSuiteTest(t, NewCMD, []cmdTest.Suite{
		{
			Title:           "one default datasource per kind",
			Args:            []string{"-f", oneDefault, "--schema", schemaPath},
			ExpectedMessage: "your resources look good\n",
		},
		{
			Title:                "two default datasources of the same kind",
			Args:                 []string{"-f", twoDefaults, "--schema", schemaPath},
			IsErrorExpected:      true,
			ExpectedRegexMessage: `^1 invalid resource\(s\) found:\n- Dashboard "perses/demo" \(file "[^"]+"\): [ab] can not be defined as default datasource: there is already a default defined for kind "PrometheusDatasource"$`,
		},
		{
			Title:           "only the dashboard not matching the schema skips the consistency checks",
			Args:            []string{"-f", sameName, "--schema", schemaPath},
			IsErrorExpected: true,
			ExpectedRegexMessage: `^2 invalid resource\(s\) found:\n` +
				`- Dashboard "perses/demo" \(file "[^"]+"\): #Dashboard\.spec\.durration: field not allowed:\n(.+\n)+` +
				`- Dashboard "perses/demo" \(file "[^"]+"\): [ab] can not be defined as default datasource: there is already a default defined for kind "PrometheusDatasource"$`,
		},
		{
			Title:           "a dashboard without spec is reported once",
			Args:            []string{"-f", noSpec, "--schema", schemaPath},
			IsErrorExpected: true,
			ExpectedRegexMessage: `^1 invalid resource\(s\) found:\n` +
				`- Dashboard "perses/demo" \(file "[^"]+"\): (.+\n)+objects\[0\]: cannot extract Dashboard, unmarshalling error: spec cannot be empty$`,
		},
		{
			Title:           "the resources around an item that is not an object are checked",
			Args:            []string{"-f", nonObject, "--schema", schemaPath},
			IsErrorExpected: true,
			ExpectedRegexMessage: `^2 invalid resource\(s\) found:\n` +
				`- objects\[1\] from file "[^"]+" must be an object, got float64\n` +
				`- Dashboard "perses/demo" \(file "[^"]+"\): [ab] can not be defined as default datasource: there is already a default defined for kind "PrometheusDatasource"$`,
		},
	})
}
