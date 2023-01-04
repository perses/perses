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

package migrate

import (
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
)

func TestMigrateCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: `required flag(s) "file" not set`,
		},
		{
			Title:           "use args",
			Args:            []string{"whatever", "-f", "file.json"},
			IsErrorExpected: true,
			ExpectedMessage: "no args are supported by the command 'migrate'",
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
