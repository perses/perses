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

package conf

import (
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	fakeapi "github.com/perses/perses/pkg/client/fake/api"
)

func TestConfigCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: false,
			ExpectedMessage: `dac:
    output_folder: built

`,
		},
		{
			Title:           "not connected to any API",
			Args:            []string{"--online"},
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any API",
		},
		{
			Title:           "remote config",
			Args:            []string{"--online"},
			IsErrorExpected: false,
			APIClient:       fakeapi.New(),
			ExpectedMessage: `security:
    readonly: false
    enable_auth: true

`,
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
