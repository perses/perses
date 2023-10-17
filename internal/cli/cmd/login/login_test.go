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

package login

import (
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
)

func TestLoginCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: "no URL has been provided or has been found in the previous configuration",
		},
		{
			Title:           "token flag used",
			Args:            []string{"--token", "foo.bar.jwt", "https://demo.perses.dev"},
			IsErrorExpected: false,
			ExpectedMessage: `successfully log in https://demo.perses.dev
`,
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
