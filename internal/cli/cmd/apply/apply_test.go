// Copyright 2022 The Perses Authors
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
	"testing"

	cmdUtilsTest "github.com/perses/perses/internal/cli/utils/test"
	"github.com/perses/perses/pkg/client/fake_api"
)

func TestApplyCMD(t *testing.T) {
	testSuite := []cmdUtilsTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: `required flag(s) "file" not set`,
		},
		{
			Title:           "not connected to any API",
			Args:            []string{"-f", "test.json"},
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any API",
		},
		{
			Title:           "apply unknown document",
			Args:            []string{"-f", "../../utils/test/sample_resources/unknown_resource.json"},
			APIClient:       fake_api.New(),
			IsErrorExpected: true,
			ExpectedMessage: `resource "game" not supported by the command`,
		},
		{
			Title:           "apply a single resource",
			Args:            []string{"-f", "../../utils/test/sample_resources/single_resource.json", "--project", "perses"},
			APIClient:       fake_api.New(),
			IsErrorExpected: false,
			ExpectedMessage: `object "Folder" "ff15" has been applied in the project "perses"
`,
		},
		{
			Title:           "apply multiples different resources",
			Args:            []string{"-f", "../../utils/test/sample_resources/multiple_resources.json", "--project", "perses"},
			APIClient:       fake_api.New(),
			IsErrorExpected: false,
			ExpectedMessage: `object "Folder" "ff15" has been applied in the project "perses"
object "Folder" "aoe4" has been applied in the project "game"
object "Project" "perses" has been applied
`,
		},
	}
	cmdUtilsTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
