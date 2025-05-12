// Copyright 2025 The Perses Authors
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

package list

import (
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	fakeapi "github.com/perses/perses/pkg/client/fake/api"
)

func TestPluginListCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "use args",
			Args:            []string{"whatever"},
			IsErrorExpected: true,
			ExpectedMessage: "no args are supported by the command 'list'",
		},
		{
			Title:           "list plugins",
			Args:            []string{},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: `   NAME   | VERSION | TYPE  | LOADED | FROM DEV  
----------+---------+-------+--------+-----------
  plugin1 | v0.1.0  | Panel | true   | false     
`,
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
