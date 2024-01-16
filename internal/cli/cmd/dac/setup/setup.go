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
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"golang.org/x/mod/semver"
)

const (
	archiveName     = "sources.tar.gz"
	depsFolderName  = "cue/"
	depsRootDstPath = "cue.mod/pkg/github.com/perses/perses" // for more info see https://cuelang.org/docs/concepts/packages/
	maxFileSize     = 10240                                  // = 10 KiB. Estimated max size for CUE files. Limit required by gosec.
	minVersion      = "v0.43.0"                              // TODO upgrade this number once DaC CUE SDK is released
)

func extractCUEDepsToDst() error {
	file, err := os.Open(archiveName)
	if err != nil {
		return err
	}
	defer file.Close()

	// Open the tar reader
	gzipReader, err := gzip.NewReader(file)
	if err != nil {
		return err
	}
	defer gzipReader.Close()
	tarReader := tar.NewReader(gzipReader)

	// Extract each CUE dep to the destination path
	// TODO simplify the code with https://github.com/mholt/archiver? Wait for stable release of v4 maybe
	depsFolderFound := false
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		// Remove the wrapping folder for following evaluations
		currentDepPath := removeFirstFolder(header.Name)

		if currentDepPath == depsFolderName {
			depsFolderFound = true
		}
		if !strings.HasPrefix(currentDepPath, depsFolderName) {
			continue
		}

		newDepPath := fmt.Sprintf("%s/%s", depsRootDstPath, currentDepPath)

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.Mkdir(newDepPath, 0666); err != nil {
				return fmt.Errorf("can't create dir %s: %v", newDepPath, err)
			}
			logrus.Debugf("dir %s created succesfully", newDepPath)
		case tar.TypeReg:
			outFile, err := os.Create(newDepPath)
			if err != nil {
				return fmt.Errorf("can't create file %s: %v", newDepPath, err)
			}
			defer outFile.Close()
			if _, err := io.CopyN(outFile, tarReader, maxFileSize); err != nil {
				if err == io.EOF {
					continue
				}
				return fmt.Errorf("can't copy content from %s: %v", header.Name, err)
			}
			logrus.Debugf("file %s extracted succesfully", newDepPath)
		default:
			return fmt.Errorf("unknown type: %b in %s", header.Typeflag, header.Name)
		}
	}

	if !depsFolderFound {
		return fmt.Errorf("CUE dependencies not found in archive")
	}

	return nil
}

func removeFirstFolder(filePath string) string {
	separatorChar := "/" // force the usage of forward slash for strings comparison

	// Split the path into individual components
	components := strings.Split(filePath, separatorChar)

	// Remove the top folder if there is at least one folder in the path
	if len(components) > 1 {
		components = components[1:]
	}

	// Join the components back into a path
	resultPath := strings.Join(components, separatorChar)

	return resultPath
}

type option struct {
	persesCMD.Option
	writer  io.Writer
	version string
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'setup'")
	}

	// If no version provided, it should default to the version of the Perses server
	if o.version == "" {
		logrus.Debug("version flag not provided, retrieving version from Perses server..")
		apiClient, err := config.Global.GetAPIClient()
		if err != nil {
			return fmt.Errorf("you need to either provide a version or be connected to a Perses server")
		}

		health, err := apiClient.V1().Health().Check()
		if err != nil {
			logrus.WithError(err).Debug("can't reach Perses server")
			return fmt.Errorf("can't retrieve version from Perses server")
		}
		o.version = health.Version
	}

	// Add "v" prefix to the version if not present
	if !strings.HasPrefix(o.version, "v") {
		o.version = fmt.Sprintf("v%s", o.version)
	}

	return nil
}

func (o *option) Validate() error {
	// Validate the format of the provided version
	if !semver.IsValid(o.version) {
		return fmt.Errorf("invalid version: %s", o.version)
	}

	// Verify that it is >= to the minimum required version
	if semver.Compare(o.version, minVersion) == -1 {
		return fmt.Errorf("version should be at least %s or higher", minVersion)
	}

	return nil
}

func (o *option) Execute() error {
	logrus.Debugf("Starting DaC setup with Perses %s", o.version)

	// Create the destination folder
	err := os.MkdirAll(depsRootDstPath, os.ModePerm)
	if err != nil {
		return fmt.Errorf("error creating the dependencies folder structure: %v", err)
	}

	// Download the source code from the provided Perses version
	err = o.downloadSources()
	if err != nil {
		return fmt.Errorf("error retrieving the Perses sources: %v", err)
	}

	defer func() {
		// Cleanup
		err = os.Remove(archiveName)
		if err != nil {
			fmt.Printf("error removing the temp archive: %v\n", err)
		}
	}()

	// Extract the CUE deps from the archive to the destination folder
	err = extractCUEDepsToDst()
	if err != nil {
		return fmt.Errorf("error extracting the CUE dependencies: %v", err)
	}

	return output.HandleString(o.writer, "DaC setup finished")
}

func (o *option) downloadSources() error {
	// Download the sources
	url := fmt.Sprintf("https://github.com/perses/perses/archive/refs/tags/%s.tar.gz", o.version)
	// NB: wrongly spotted as unsecure by gosec; we are validating/sanitizing the string interpolated upfront thus no risk here
	response, err := http.Get(url) // nolint: gosec
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("error: Unable to fetch release. Status code: %d", response.StatusCode)
	}

	// Save the content to a local file
	outFile, err := os.Create(archiveName)
	if err != nil {
		return fmt.Errorf("error creating file: %v", err)
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, response.Body)
	if err != nil {
		return fmt.Errorf("error copying content to file: %v", err)
	}

	logrus.Debug("Perses release archive downloaded successfully")

	return nil
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "setup",
		Short: "Sets up a local development environment to do Dashboard-as-Code",
		Long: `
takes care of adding the CUE sources from Perses as external dependencies to your DaC repo.
/!\ It must be executed at the root of your repo.
`,
		Example: `
# DaC setup when you are connected to a server
percli dac setup

# DaC setup when you are not connected to a server, you need to provide the Perses version to consider for dependencies retrieval
percli dac setup --version 0.42.1
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.version, "version", "", "Version of Perses from which to retrieve the CUE dependencies.")

	return cmd
}
