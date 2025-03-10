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
)

func TestDacSetupCMD(t *testing.T) {
	// Retrieve the current working directory
	originalWD, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	// Change working directory to testdata
	if err := os.Chdir("testdata"); err != nil {
		t.Fatalf("Failed to change directory to testdata: %v", err)
	}
	// change back to the original working directory on defer
	defer func() {
		if err := os.Chdir(originalWD); err != nil {
			t.Fatalf("Failed to change back to the original directory: %v", err)
		}
	}()

	testSuite := []cmdTest.Suite{
		// TODO add test for nominal case with CUE (need to deal with `cue login`...)
		{
			Title:           "Nominal case with Go",
			Args:            []string{"--language", "go", "--version", "v0.50.0"},
			IsErrorExpected: false,
			ExpectedMessage: "DaC setup for go finished successfully\n",
		},
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
}
