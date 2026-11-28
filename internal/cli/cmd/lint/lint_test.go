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
	"errors"
	"fmt"
	"path/filepath"
	"testing"

	"github.com/perses/perses/internal/api/plugin/schema"
	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/perses/perses/internal/test"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/dashboard"
	"github.com/stretchr/testify/assert"
)

func TestLintCMD(t *testing.T) {
	pluginFolder := filepath.Join(test.GetRepositoryPath(), "internal", "api", "plugin", "migrate", "testdata", "plugins")
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: `at least one of the flags in the group [file directory] is required`,
		},
		{
			Title:           "use args",
			Args:            []string{"whatever", "-f", "file.json"},
			IsErrorExpected: true,
			ExpectedMessage: "no args are supported by the command 'lint'",
		},
		{
			Title:           "lint unknown document",
			Args:            []string{"-f", "../../test/sample_resources/unknown_resource.json"},
			IsErrorExpected: true,
			ExpectedMessage: `1 invalid resource(s) found:
- objects[0]: resource "game" from file "../../test/sample_resources/unknown_resource.json" not supported by the command`,
		},
		{
			Title:           "lint a single resource",
			Args:            []string{"-f", "../../test/sample_resources/single_resource.json"},
			IsErrorExpected: false,
			ExpectedMessage: `your resources look good
`,
		},
		{
			Title:           "lint multiples different resources",
			Args:            []string{"-f", "../../test/sample_resources/multiple_resources.json"},
			IsErrorExpected: false,
			ExpectedMessage: `your resources look good
`,
		},
		{
			Title:           "lint a dashboard with the plugin archives",
			Args:            []string{"-f", "testdata/dashboard.json", "--plugin.path", cmdTest.ArchivePlugins(t, pluginFolder)},
			IsErrorExpected: false,
			ExpectedMessage: `your resources look good
`,
		},
		{
			Title:           "lint a file reports every resource that cannot be decoded",
			Args:            []string{"-f", "testdata/lint_invalid/mixed.json"},
			IsErrorExpected: true,
			ExpectedMessage: `2 invalid resource(s) found:
- file "testdata/lint_invalid/mixed.json": objects[1]: cannot extract Dashboard, unmarshalling error: spec cannot be empty
- objects[2] from file "testdata/lint_invalid/mixed.json" unable to find 'kind' field`,
		},
		{
			Title:           "lint a directory reports every invalid file",
			Args:            []string{"-d", "testdata/lint_invalid"},
			IsErrorExpected: true,
			ExpectedMessage: fmt.Sprintf(`4 invalid resource(s) found:
- file %[1]q: objects[1]: cannot extract Dashboard, unmarshalling error: spec cannot be empty
- objects[2] from file %[1]q unable to find 'kind' field
- objects[0]: resource "game" from file %[2]q not supported by the command
- objects[0] from file %[3]q unable to find 'kind' field`,
				filepath.Join("testdata", "lint_invalid", "mixed.json"),
				filepath.Join("testdata", "lint_invalid", "unknown_kind.json"),
				filepath.Join("testdata", "lint_invalid", "zz_missing_kind.json")),
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}

// failingPanelSchema is a schema that rejects every panel.
type failingPanelSchema struct {
	schema.Schema
}

func (s *failingPanelSchema) ValidateDashboardVariables([]dashboard.Variable) error {
	return nil
}

func (s *failingPanelSchema) ValidateDashboardAnnotations([]dashboard.AnnotationSpec) error {
	return nil
}

func (s *failingPanelSchema) ValidatePanels(map[string]*dashboard.Panel) error {
	return errors.New("invalid panel")
}

func newDashboard(project, name string) *modelV1.Dashboard {
	dash := &modelV1.Dashboard{Kind: modelV1.KindDashboard}
	dash.Metadata.Name = name
	dash.Metadata.Project = project
	return dash
}

func TestValidateReportsEveryInvalidResource(t *testing.T) {
	o := &option{sch: &failingPanelSchema{}}
	lintErrors := o.validate([]sourcedEntity{
		{entity: newDashboard("perses", "first"), file: "first.json"},
		{entity: newDashboard("perses", "second"), file: "second.json"},
	})
	assert.Equal(t, `2 invalid resource(s) found:
- Dashboard "perses/first" (file "first.json"): invalid panel
- Dashboard "perses/second" (file "second.json"): invalid panel`, buildError(lintErrors).Error())
}

func TestLintErrorMessage(t *testing.T) {
	errs := []*lintError{
		{kind: "Dashboard", project: "perses", name: "demo", file: "dashboards/demo.yaml", err: errors.New("invalid panel")},
		{kind: "GlobalDatasource", name: "prom", err: errors.New("invalid plugin")},
		{file: "broken.json", err: errors.New("unable to read")},
	}
	expected := `3 invalid resource(s) found:
- Dashboard "perses/demo" (file "dashboards/demo.yaml"): invalid panel
- GlobalDatasource "prom": invalid plugin
- file "broken.json": unable to read`
	assert.Equal(t, expected, buildError(errs).Error())
}
