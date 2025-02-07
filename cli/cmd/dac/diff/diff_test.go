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

package diff

import (
	"testing"

	"github.com/perses/perses/cli/config"
	cmdTest "github.com/perses/perses/cli/test"
	fakeapi "github.com/perses/perses/pkg/client/fake/api"
)

func TestDiffCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any API",
		},
		{
			Title:           "no dashboard",
			Args:            []string{},
			APIClient:       fakeapi.New(),
			Config:          config.Config{Dac: config.Dac{OutputFolder: "./emptybuild"}},
			IsErrorExpected: true,
			ExpectedMessage: "no dashboard found to create the diff",
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
