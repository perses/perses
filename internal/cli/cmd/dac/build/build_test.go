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

package build

import (
	"fmt"
	"os"
	"runtime"
	"strings"
	"testing"

	"github.com/perses/perses/internal/cli/config"
	cmdTest "github.com/perses/perses/internal/cli/test"
)

func TestDacBuildCMD(t *testing.T) {
	// os-specific separator is required for the tests that go through the code that calls filepath.Walk
	separator := string(os.PathSeparator)

	// os-specific error strings are required for the "file not found" cases
	winSpecificErrStr := "GetFileAttributesEx %s: The system cannot find the file specified."
	linuxSpecificErrStr := "stat %s: no such file or directory"
	unknownFileName := "idontexist.cue"
	unknownDirName := "idontexist"
	var fileNotFoundErrStr string
	var dirNotFoundErrStr string
	if runtime.GOOS == "windows" {
		fileNotFoundErrStr = fmt.Sprintf(winSpecificErrStr, unknownFileName)
		dirNotFoundErrStr = fmt.Sprintf(winSpecificErrStr, unknownDirName)
	} else {
		fileNotFoundErrStr = fmt.Sprintf(linuxSpecificErrStr, unknownFileName)
		dirNotFoundErrStr = fmt.Sprintf(linuxSpecificErrStr, unknownDirName)
	}

	testSuiteCommonAndGo := []cmdTest.Suite{
		{
			Title:           "file not found",
			Args:            []string{"-f", unknownFileName},
			IsErrorExpected: true,
			ExpectedMessage: fmt.Sprintf("invalid value set to the File flag: %s", fileNotFoundErrStr),
		},
		{
			Title:           "directory not found",
			Args:            []string{"-d", unknownDirName},
			IsErrorExpected: true,
			ExpectedMessage: fmt.Sprintf("invalid value set to the Directory flag: %s", dirNotFoundErrStr),
		},
		{
			Title:           "file & directory options should not be both provided",
			Args:            []string{"-f", "whatever.cue", "-d", "whocares"},
			IsErrorExpected: true,
			ExpectedMessage: "if any flags in the group [file directory] are set none of the others can be; [directory file] were all set",
		},
		{
			Title:           "nominal case with a single Go file",
			Args:            []string{"-f", "testdata/go/main.go"},
			IsErrorExpected: false,
			ExpectedMessage: strings.ReplaceAll("Succesfully built testdata/go/main.go at built%stestdata%sgo%smain_output.yaml\n", "%s", separator),
		},
		{
			Title:           "nominal case with a Go project",
			Args:            []string{"-d", "testdata/go"},
			IsErrorExpected: false,
			ExpectedMessage: strings.ReplaceAll("Succesfully built testdata%sgo%smain.go at built%stestdata%sgo%smain_output.yaml\n", "%s", separator),
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuiteCommonAndGo)

	// Change to the cue test directory to be able to resolve imports
	err := os.Chdir(strings.ReplaceAll("testdata%scue", "%s", separator))
	if err != nil {
		t.Fatalf("Failed to change directory: %v", err)
	}

	testSuiteCUE := []cmdTest.Suite{
		{
			Title:           "nominal case with a single cue file",
			Args:            []string{"-f", "valid/dac.cue"},
			IsErrorExpected: false,
			ExpectedMessage: strings.ReplaceAll("Succesfully built valid/dac.cue at built%svalid%sdac_output.yaml\n", "%s", separator),
		},
		{
			Title:           "nominal case with a cue directory",
			Args:            []string{"-d", "valid"},
			IsErrorExpected: false,
			ExpectedMessage: strings.ReplaceAll("Succesfully built valid%sdac.cue at built%svalid%sdac_output.yaml\nSuccesfully built valid%sdac_2.cue at built%svalid%sdac_2_output.yaml\n", "%s", separator),
		},
		{
			Title:           "print on stdout as json",
			Args:            []string{"-f", "valid/dac_2.cue", "-m", "stdout", "-o", "json"},
			IsErrorExpected: false,
			ExpectedMessage: "{\n    \"success\": true\n}\n\n",
		},
		{
			Title:           "invalid CUE definition",
			Args:            []string{"-f", "invalid/dac.cue"},
			IsErrorExpected: true,
			ExpectedMessage: strings.ReplaceAll("failed to build invalid/dac.cue: success: reference \"fals\" not found:\n    .%sinvalid%sdac.cue:16:10\n", "%s", separator),
		},
		{
			Title:           "invalid CUE definition in a folder",
			Args:            []string{"-d", "invalid"},
			IsErrorExpected: true,
			ExpectedMessage: `processing directory "invalid" failed, see the message(s) above`,
		},
		{
			Title:           "nominal case with a custom output folder",
			Args:            []string{"-f", "valid/dac.cue"},
			Config:          config.Config{Dac: config.Dac{OutputFolder: "test_output"}},
			IsErrorExpected: false,
			ExpectedMessage: strings.ReplaceAll("Succesfully built valid/dac.cue at test_output%svalid%sdac_output.yaml\n", "%s", separator),
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuiteCUE)
}
