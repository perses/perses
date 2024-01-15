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

package build

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/spf13/cobra"
)

const outputFolderName = "built"

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.DirectoryOption
	opt.OutputOption
	writer io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'setup'")
	}

	// Complete the output only if it has been set by the user
	if len(o.Output) > 0 {
		if outputErr := o.OutputOption.Complete(); outputErr != nil {
			return outputErr
		}
	} else {
		// Put explicitely a value when not provided, as we use it for file generation in Execute()
		o.Output = output.YAMLOutput
	}

	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	// NB: this command is mostly based on the `eval` command of the cue CLI.
	// NB2: Since cue is written in Go, we could consider relying on its code instead of going the exec way.
	//      However the cue code is (for now at least) not well packaged for such external reuse.
	//      See https://github.com/cue-lang/cue/blob/master/cmd/cue/cmd/eval.go#L87
	cmd := exec.Command("cue", "eval", o.File, "--out", o.Output, "--concrete")

	// Capture the output of the command
	cmdOutput, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return fmt.Errorf("failed to build %s: %s", o.File, string(exitErr.Stderr))
		}
		return err
	}

	// Create the folder (+ any parent folder if applicable) where to store the output
	err = os.MkdirAll(filepath.Join(outputFolderName, filepath.Dir(o.File)), os.ModePerm)
	if err != nil {
		return fmt.Errorf("error creating the output folder: %v", err)
	}

	// Build the path of the file where to store the command output
	outputFilePath := buildOutputFilePath(o.File, o.OutputOption.Output)

	// Write the output to the file
	err = writeToFile(outputFilePath, cmdOutput)
	if err != nil {
		return fmt.Errorf("error writing to %s: %v", outputFilePath, err)
	}

	return nil
}

// buildOutputFilePath generates the output file path based on the input file path
func buildOutputFilePath(inputFilePath string, ext string) string {
	// Extract the file name without extension
	baseName := strings.TrimSuffix(inputFilePath, filepath.Ext(inputFilePath))
	// Build the output file path in the "built" folder with the same name as the input file
	return filepath.Join(outputFolderName, fmt.Sprintf("%s_output.%s", baseName, ext)) // Change the extension as needed
}

// writeToFile writes data to a file
func writeToFile(filePath string, data []byte) error {
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(data)
	return err
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "build",
		Short: "Build the given CUE file",
		Long: `
Generate the final output (YAML by default, or JSON) of the given CUE file & store the result in the 'built' folder.
The generation part is the same as if you were running the 'eval' command of the cue CLI. 
`,
		Example: `
# build a given CUE file
percli dac build -f my_dashboard.cue

# build a given CUE file as JSON
percli dac build -f my_dashboard.cue -ojson
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddDirectoryFlags(cmd, &o.DirectoryOption)
	opt.AddOutputFlags(cmd, &o.OutputOption)
	opt.MarkFileFlagAsMandatory(cmd)

	return cmd
}
