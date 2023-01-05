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

package remove

import (
	"testing"

	"github.com/perses/perses/internal/cli/resource"
	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/perses/perses/pkg/client/fake/api"
)

func TestDeleteCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: resource.FormatMessage(),
		},
		{
			Title:           "kind not managed",
			Args:            []string{"whatever"},
			IsErrorExpected: true,
			ExpectedMessage: `resource "whatever" not managed`,
		},
		{
			Title:           "not connected to any API",
			Args:            []string{"project", "perses"},
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any API",
		},
		{
			Title:           "delete all projects",
			Args:            []string{"project", "--all"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: `object "Project" "Amadeus" has been deleted
object "Project" "Chronosphere" has been deleted
object "Project" "perses" has been deleted
`,
		},
		{
			Title:           "delete a single resource",
			Args:            []string{"folders", "ff15", "--project", "perses"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: `object "Folder" "ff15" has been deleted in the project "perses"
`,
		},
		{
			Title:           "delete unknown document from a file",
			Args:            []string{"-f", "../../test/sample_resources/unknown_resource.json"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: true,
			ExpectedMessage: `resource "game" not supported by the command`,
		},
		{
			Title:           "delete a single resource from a file",
			Args:            []string{"-f", "../../test/sample_resources/single_resource.json", "--project", "perses"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: `object "Folder" "ff15" has been deleted in the project "perses"
`,
		},
		{
			Title:           "delete multiples resources from a file",
			Args:            []string{"-f", "../../test/sample_resources/multiple_resources.json", "--project", "perses"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: `object "Folder" "aoe4" has been deleted in the project "game"
object "Folder" "ff15" has been deleted in the project "perses"
object "Project" "perses" has been deleted
`,
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
