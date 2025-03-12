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

package setup

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"golang.org/x/mod/semver"
)

const (
	cueLanguage      = "cue"
	goLanguage       = "go"
	cueSchemasPath   = "cue/"
	minVersionForGo  = "v0.44.0"        // Release that introduced the Go SDK
	minVersionForCue = "v0.51.0-beta.0" // Release that brought the move to CUE's new modules -> TODO change to stable v0.51.0 once released
	exampleCUEDac    = `package mydac

import "github.com/perses/perses/cue/dac-utils/dashboard@v0"

test: dashboard & { #name: "myDashboardAsCode" }`
)

func addOutputDirToGitignore() error {
	gitignorePath := ".gitignore"
	comment := "# folder used to store the results of the `percli dac build` command"

	// Skip if .gitignore doesn't exist
	if _, err := os.Stat(gitignorePath); os.IsNotExist(err) {
		logrus.Debugf("%s is not present", gitignorePath)
		return nil
	} else if err != nil {
		return err
	}

	// Open the .gitignore file
	file, err := os.OpenFile(gitignorePath, os.O_RDWR|os.O_APPEND, os.ModeAppend)
	if err != nil {
		return fmt.Errorf("error opening %s: %v", gitignorePath, err)
	}
	defer file.Close()

	// Check & skip if the output dir is already listed
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		if strings.TrimSpace(scanner.Text()) == config.Global.Dac.OutputFolder {
			logrus.Debugf("%s dir is already ignored", config.Global.Dac.OutputFolder)
			return nil
		}
	}

	// Append the output folder to the list
	if _, writeErr := file.WriteString(fmt.Sprintf("\n%s\n%s\n", comment, config.Global.Dac.OutputFolder)); writeErr != nil {
		return fmt.Errorf("error appending to %s: %v", gitignorePath, writeErr)
	}

	logrus.Debugf("%s dir appended to %s", config.Global.Dac.OutputFolder, gitignorePath)
	return nil
}

func computeProperVersion(version string) (string, error) {
	finalVersion := version

	// If no version provided, let's try to get the version from the Perses server
	if finalVersion == "" {
		logrus.Debug("version flag not provided, retrieving version from Perses server..")
		apiClient, err := config.Global.GetAPIClient()
		if err != nil {
			return "", fmt.Errorf("you need to either provide a version or be connected to a Perses server")
		}

		health, err := apiClient.V1().Health().Check()
		if err != nil {
			logrus.WithError(err).Debug("can't reach Perses server")
			return "", fmt.Errorf("can't retrieve version from Perses server")
		}
		finalVersion = health.Version
	}

	// Add "v" prefix to the version if not present
	if !strings.HasPrefix(finalVersion, "v") {
		finalVersion = fmt.Sprintf("v%s", finalVersion)
	}

	// Final validation
	if !semver.IsValid(finalVersion) {
		return "", fmt.Errorf("invalid version: %s", finalVersion)
	}

	return finalVersion, nil
}

type option struct {
	persesCMD.Option
	writer    io.Writer
	errWriter io.Writer
	version   string
	language  string
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'setup'")
	}

	version, err := computeProperVersion(o.version)
	if err != nil {
		return err
	}
	o.version = version

	o.language = strings.ToLower(o.language)

	return nil
}

func (o *option) Validate() error {

	switch o.language {
	case cueLanguage:
		if semver.Compare(o.version, minVersionForCue) == -1 {
			return fmt.Errorf("version should be at least %s or higher", minVersionForCue)
		}
		if err := exec.Command("cue", "version").Run(); err != nil {
			return fmt.Errorf("unable to use the required cue binary: %w", err)
		}
	case goLanguage:
		if semver.Compare(o.version, minVersionForGo) == -1 {
			return fmt.Errorf("version should be at least %s or higher", minVersionForGo)
		}
		if err := exec.Command("go", "version").Run(); err != nil {
			return fmt.Errorf("unable to use the required go binary: %w", err)
		}
	default:
		return fmt.Errorf("language %q is not supported", o.language)
	}

	return nil
}

func (o *option) Execute() error {
	logrus.Debugf("Starting DaC setup with Perses %s", o.version)

	// Add the DaC output folder to .gitignore, if applicable
	if err := addOutputDirToGitignore(); err != nil {
		logrus.WithError(err).Warningf("unable to add the '%s' folder to .gitignore", config.Global.Dac.OutputFolder)
	}

	// Install dependencies
	if o.language == cueLanguage {
		// Check cue.mod exists
		if _, err := os.Stat("cue.mod"); os.IsNotExist(err) {
			return fmt.Errorf("unable to find the 'cue.mod' dir. Please run 'cue mod init'")
		} else if err != nil {
			return err
		}
		// Resolve the sdk dependency (= write an example file
		// and run 'cue mod tidy')
		exampleFilePath := "example.cue"
		if err := os.WriteFile(exampleFilePath, []byte(exampleCUEDac), 0600); err != nil {
			return fmt.Errorf("failed to create example.cue: %w", err)
		}
		logrus.Debugf("example.cue file created successfully")
		cmd := exec.Command("cue", "mod", "tidy")
		cmd.Stdout = o.writer
		cmd.Stderr = o.errWriter
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to run 'cue mod tidy': %w", err)
		}
		logrus.Debugf("'cue mod tidy' executed successfully")
	} else if o.language == goLanguage {
		// Check go.mod exists
		if _, err := os.Stat("go.mod"); os.IsNotExist(err) {
			return fmt.Errorf("unable to find the file 'go.mod'. Please run 'go mod init'")
		} else if err != nil {
			return err
		}
		// Resolve the sdk dependency
		if err := exec.Command("go", "get", fmt.Sprintf("github.com/perses/perses@%s", o.version)).Run(); err != nil { // nolint: gosec
			return fmt.Errorf("unable to get the go dependencies github.com/perses/perses@%s : %w", o.version, err)
		}
	} else {
		return fmt.Errorf("language %q is not supported", o.language)
	}

	return output.HandleString(o.writer, fmt.Sprintf("DaC setup for %s finished successfully", o.language))
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
		Use:   "setup",
		Short: "Set up a local development environment to code dashboards",
		Long: `
This command takes care of setting up a ready-to-use development environment to code dashboards.
It mainly consists in retrieving the Perses libraries to start coding dashboards. The setup is language-specific (default: CUE).

/!\ This command must be executed at the root of your repo.
`,
		Example: `
# DaC setup when you are connected to a server
percli dac setup

# DaC setup when you are not connected to a server, you need to provide the Perses version to consider for dependencies retrieval
percli dac setup --version 0.47.1 # any version you'd like above v0.44.0
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.language, "language", "cue", "language choosen for the setup. Possible value: cue, go.")
	cmd.Flags().StringVar(&o.version, "version", "", "Version of Perses from which to retrieve the CUE dependencies.")

	return cmd
}
