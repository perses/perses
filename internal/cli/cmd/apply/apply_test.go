// Copyright 2023 The Perses Authors
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

package apply

import (
	"os"
	"strings"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	fakeapi "github.com/perses/perses/pkg/client/fake/api"
)

func TestApplyCMD(t *testing.T) {
	// NB: some tests are checking error messages containing file paths. In such case
	// the message may contain os-specific path separators that we have to deal with.
	var separator string
	if os.PathSeparator == '\\' {
		// For some reason we need to double the separator on windows..
		separator = string(os.PathSeparator) + string(os.PathSeparator)
	} else {
		separator = string(os.PathSeparator)
	}

	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: "at least one of the flags in the group [file directory] is required",
		},
		{
			Title:           "not connected to any API",
			Args:            []string{"-f", "test.json"},
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any API",
		},
		{
			Title:           "apply unknown document",
			Args:            []string{"-f", "../../test/sample_resources/unknown_resource.json"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: true,
			ExpectedMessage: `resource "game" from file "../../test/sample_resources/unknown_resource.json" not supported by the command`,
		},
		{
			Title:           "apply a single resource",
			Args:            []string{"-f", "../../test/sample_resources/single_resource.json", "--project", "perses"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: `object "Folder" "ff15" has been applied in the project "perses"
`,
		},
		{
			Title:           "apply multiples different resources without force creation",
			Args:            []string{"-f", "../../test/sample_resources/multiple_resources.json", "--project", "foo"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: true,
			ExpectedMessage: `2 errors occurred:
	* inconsistency has been detected for object "Folder" "aoe4": while the metadata suggests the project name "game", the currently selected project indicates "foo",
	* inconsistency has been detected for object "Folder" "foo": while the metadata suggests the project name "perses", the currently selected project indicates "foo",
To enforce creation while respecting the metadata, use the '--force' flag
`,
		},
		{
			Title:           "apply multiples different resources with force creation",
			Args:            []string{"-f", "../../test/sample_resources/multiple_resources.json", "--project", "perses", "--force"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: `object "Folder" "ff15" has been applied in the project "perses"
object "Folder" "aoe4" has been applied in the project "game"
object "Folder" "foo" has been applied in the project "perses"
object "Project" "perses" has been applied
`,
		},
		{
			Title:           "apply resources from a folder",
			Args:            []string{"-d", "../../test/sample_resources", "--project", "perses"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: true,
			ExpectedMessage: strings.Replace(`resource "game" from file "..%s..%stest%ssample_resources%sunknown_resource.json" not supported by the command`, "%s", separator, -1),
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
