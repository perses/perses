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
	"fmt"
	"os"
	"path/filepath"
	"testing"

	apiCue "github.com/perses/perses/internal/api/cue"
	"github.com/perses/perses/internal/api/plugin/schema"
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

func TestDashboardSchemaValidate(t *testing.T) {
	sch, err := loadDashboardSchema(writeFile(t, t.TempDir(), "schema.cue", testSchema))
	require.NoError(t, err)

	misspelled := newTestDashboard(map[string]any{"kind": "Markdown", "spec": map[string]any{"text": "x"}})
	misspelled["spec"].(map[string]any)["durration"] = "6h"

	// The YAML decoder returns a map[any]any when a key is an unquoted number.
	numericKey := newTestDashboard(map[string]any{"kind": "Chart", "spec": map[string]any{"unit": "ops"}})
	numericKey["spec"].(map[string]any)["panels"] = map[any]any{0: numericKey["spec"].(map[string]any)["panels"].(map[string]any)["cpu"]}

	testSuites := []struct {
		title     string
		dashboard map[string]any
		expected  string
	}{
		{
			title:     "valid dashboard",
			dashboard: newTestDashboard(map[string]any{"kind": "Chart", "spec": map[string]any{"unit": "bytes"}}),
		},
		{
			title:     "misspelled field outside the plugins",
			dashboard: misspelled,
			expected:  "spec.durration: field not allowed",
		},
		{
			title:     "invalid value in a plugin",
			dashboard: newTestDashboard(map[string]any{"kind": "Chart", "spec": map[string]any{"unit": "ops"}}),
			expected: `spec.panels.cpu.spec.plugin: 5 errors in empty disjunction:
spec.panels.cpu.spec.plugin.kind: conflicting values "Markdown" and "Chart"
spec.panels.cpu.spec.plugin.spec.unit: 3 errors in empty disjunction:
spec.panels.cpu.spec.plugin.spec.unit: conflicting values "bytes" and "ops"
spec.panels.cpu.spec.plugin.spec.unit: conflicting values "percent" and "ops"
spec.panels.cpu.spec.plugin.spec.unit: conflicting values "seconds" and "ops"`,
		},
		{
			title:     "unknown field in a plugin",
			dashboard: newTestDashboard(map[string]any{"kind": "Markdown", "spec": map[string]any{"txt": "x"}}),
			expected: `spec.panels.cpu.spec.plugin: 2 errors in empty disjunction:
spec.panels.cpu.spec.plugin.kind: conflicting values "Chart" and "Markdown"
spec.panels.cpu.spec.plugin.spec.txt: field not allowed`,
		},
		{
			title:     "unknown plugin",
			dashboard: newTestDashboard(map[string]any{"kind": "Gauge", "spec": map[string]any{}}),
			expected: `spec.panels.cpu.spec.plugin: 2 errors in empty disjunction:
spec.panels.cpu.spec.plugin.kind: conflicting values "Chart" and "Gauge"
spec.panels.cpu.spec.plugin.kind: conflicting values "Markdown" and "Gauge"`,
		},
		{
			title:     "invalid plugin under a numeric YAML key",
			dashboard: numericKey,
			expected: `spec.panels."0".spec.plugin: 5 errors in empty disjunction:
spec.panels."0".spec.plugin.kind: conflicting values "Markdown" and "Chart"
spec.panels."0".spec.plugin.spec.unit: 3 errors in empty disjunction:
spec.panels."0".spec.plugin.spec.unit: conflicting values "bytes" and "ops"
spec.panels."0".spec.plugin.spec.unit: conflicting values "percent" and "ops"
spec.panels."0".spec.plugin.spec.unit: conflicting values "seconds" and "ops"`,
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			err := sch.validate(test.dashboard)
			if len(test.expected) == 0 {
				assert.NoError(t, err)
				return
			}
			if assert.Error(t, err) {
				assert.Equal(t, test.expected, err.Error())
			}
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
	schemaPath := writeFile(t, dir, "schema.cue", string(data))
	valid := writeFile(t, dir, "valid.json", `{"kind":"Dashboard","metadata":{"name":"demo","project":"perses"},"spec":{"display":{"name":"demo"},"duration":"6h","layouts":[],"panels":{}}}`)
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
			ExpectedMessage: "variable name '123' is not valid",
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
			ExpectedMessage: `invalid dashboard "demo": spec.durration: field not allowed`,
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
			ExpectedRegexMessage: `^unexpected error in dashboard "demo": [ab] can not be defined as default datasource: there is already a default defined for kind "PrometheusDatasource"$`,
		},
	})
}
