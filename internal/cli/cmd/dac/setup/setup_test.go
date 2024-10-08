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

package setup

import (
	"os"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/sirupsen/logrus"
)

func TestDacSetupCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		// TODO add test for nominal case once a Perses release with the updated structure (= `cue` folder at the root) is available
		{
			Title:           "no version provided & no server",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: "you need to either provide a version or be connected to a Perses server",
		},
		{
			Title:           "invalid version provided",
			Args:            []string{"--version", "yes"},
			IsErrorExpected: true,
			ExpectedMessage: "invalid version: vyes",
		},
		{
			Title:           "too-old Perses version submitted",
			Args:            []string{"--version", "0.42.1"},
			IsErrorExpected: true,
			ExpectedMessage: "version should be at least v0.47.0 or higher",
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)

	// Cleanup generated files
	err := os.RemoveAll("cue.mod")
	if err != nil {
		logrus.WithError(err).Error("error removing the files generated by the tests")
	}
}
