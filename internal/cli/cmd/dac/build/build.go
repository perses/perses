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
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

const (
	modeFile     = "file"
	modeStdout   = "stdout"
	goExtension  = ".go"
	cueExtension = ".cue"
)

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.DirectoryOption
	opt.OutputOption
	writer    io.Writer
	errWriter io.Writer
	args      []string
	Mode      string
}

func (o *option) Complete(args []string) error {
	o.args = args
	if outputErr := o.OutputOption.Complete(); outputErr != nil {
		return outputErr
	}
	return nil
}

func (o *option) Validate() error {
	if o.Mode != modeFile && o.Mode != modeStdout {
		return fmt.Errorf("invalid mode provided: must be either `file` or `stdout`")
	}

	if o.File != "" {
		return o.FileOption.Validate()
	}
	return o.DirectoryOption.Validate()
}

func (o *option) Execute() error {
	if o.File != "" {
		return o.processFile(o.File, filepath.Ext(o.File))
	}

	var errs []error
	// Else it's a directory, thus walk it and process each file
	err := filepath.Walk(o.Directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Process regular files only
		if info.IsDir() {
			return nil
		}

		extension := filepath.Ext(path)
		if extension == goExtension || extension == cueExtension {
			err = o.processFile(path, extension)
			if err != nil {
				// Append the error to highlight the issue to the user on a later stage but don't stop the processing
				errs = append(errs, fmt.Errorf("error processing file %q: %w", path, err))
			}
		} else {
			logrus.Debugf("file %q has been ignored", path)
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("error processing directory %q: %v", o.Directory, err)
	}

	if len(errs) > 0 {
		_, _ = fmt.Fprintln(o.errWriter, "  FAILED:")
		for _, e := range errs {
			_, _ = fmt.Fprintln(o.errWriter, e.Error())
		}
		return fmt.Errorf("processing directory %q failed, see the message(s) above", o.Directory)
	}

	return nil
}

func (o *option) processFile(file string, extension string) error {
	var cmd *exec.Cmd

	if extension == goExtension {
		// The command `go run` must be executed in the directory where the file is located.
		// That's because, go is searching the go.mod file, first in the current directory, then in the parent directories.
		// So when using multiple go submodules, to ensure it is the correct go.mod considered,
		// we must be in the closest directory to the file.
		folder := filepath.Dir(file)
		extractedFile := filepath.Base(file)
		cmd = exec.Command("go", "run", extractedFile, "--output", o.Output, strings.Join(o.args, " ")) // #nosec
		cmd.Dir = folder
	} else if extension == cueExtension {
		// NB: most of the work of the `build` command is actually made by the `eval` command of the cue CLI.
		// NB2: Since cue is written in Go, we could consider relying on its code instead of going the exec way.
		//      However, the cue code is (for now at least) not well packaged for such an external reuse.
		//      See https://github.com/cue-lang/cue/blob/master/cmd/cue/cmd/eval.go#L87
		// NB3: #nosec is needed here even if the user-fed parts of the command are sanitized upstream
		cmd = exec.Command("cue", "eval", file, "--out", o.Output, "--concrete") // #nosec
	} else {
		return output.HandleString(o.writer, fmt.Sprintf("skipping %q because it is neither a `cue` or `go` file", file))
	}

	// Capture the output of the command
	cmdOutput, err := cmd.Output()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			return fmt.Errorf("failed to build %s: %s", file, string(exitErr.Stderr))
		}
		return err
	}

	// If mode = stdout, print the command result on the standard output & don't go further
	if o.Mode == modeStdout {
		return output.HandleString(o.writer, string(cmdOutput))
	}

	// Otherwise, create an output file under the output directory:

	// Create the folder (+ any parent folder if applicable) where to store the output
	err = os.MkdirAll(filepath.Join(config.Global.Dac.OutputFolder, filepath.Dir(file)), os.ModePerm)
	if err != nil {
		return fmt.Errorf("error creating the output folder: %v", err)
	}

	// Build the path of the file where to store the command output
	outputFilePath := o.buildOutputFilePath(file)

	// Write the output to the file
	if writeErr := os.WriteFile(outputFilePath, cmdOutput, 0644); writeErr != nil { // nolint: gosec
		return fmt.Errorf("error writing to %s: %v", outputFilePath, writeErr)
	}
	return output.HandleString(o.writer, fmt.Sprintf("Succesfully built %s at %s", file, outputFilePath))
}

// buildOutputFilePath generates the output file path based on the input file path
func (o *option) buildOutputFilePath(inputFilePath string) string {
	// Extract the file name without extension
	baseName := strings.TrimSuffix(inputFilePath, filepath.Ext(inputFilePath))
	// Build the output file path in the "built" folder with the same name as the input file
	return filepath.Join(config.Global.Dac.OutputFolder, fmt.Sprintf("%s_output.%s", baseName, o.Output)) // Change the extension as needed
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "build",
		Short: "Build the given DaC file(s)",
		Long: `
Generate the final output (YAML by default, or JSON) of the given DaC file - or directory containing DaC files.
The supported languages for a DaC are:
- CUE
- Go

The result(s) is/are by default stored in a/multiple file(s) under the 'built' folder, but can also be printed on the standard output instead.
For Go, file must comply with "go run": the file package must be main and a main function, starting with 'exec := sdk.NewExec()' and finishing with 'exec.BuildDashboard(...)'

NB: "percli dac build -f my_dashboard.cue -m stdout" is basically doing the same as "cue eval my_dashboard.cue", however be aware that "percli dac build -d mydir -m stdout" is not equivalent to "cue eval mydir": in the case of percli each CUE file encountered in the directory is evaluated independently.
And "percli dac build -f main.go -m stdout" is basically doing the same as "go run main.go"
`,
		Example: `
# build a given file
percli dac build -f my_dashboard.cue

# build a given file as JSON
percli dac build -f main.go -ojson

# build a given file & deploy the resulting resource right away
percli dac build -f my_dashboard.cue -m stdout | percli apply -f -

# build all the files under a given directory
percli dac build -d my_dashboards

# build all the files under a given directory & deploy the resulting resources right away
percli dac build -d my_dashboards && percli apply -d built

# build a given file as JSON providing extra arguments to the Go program
percli dac build -f main.go -ojson -- --arg1=value1 --arg2=value2
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVarP(&o.Mode, "mode", "m", "file", "Mode for the output. Must be either `file` to automatically save the content to file(s), or `stdout` to print on the standard output. Default is file.")
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddDirectoryFlags(cmd, &o.DirectoryOption)
	opt.AddOutputFlags(cmd, &o.OutputOption)
	opt.MarkFileAndDirFlagsAsXOR(cmd)

	return cmd
}
