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
	"github.com/spf13/cobra"
)

const archiveName = "sources.tar.gz"
const depsParentFolder = "cue"
const depsDstFolder = "cue.mod/pkg/github.com/perses/perses" // for more info see https://cuelang.org/docs/concepts/packages/

type option struct {
	persesCMD.Option
	writer  io.Writer
	verbose bool
	version string
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'setup'")
	}
	// If no version provided it should default to the version of the Perses server
	if o.version == "" {
		if o.verbose {
			fmt.Println("version flag not provided, retrieving version from Perses server..")
		}
		apiClient, err := config.Global.GetAPIClient()
		if err != nil {
			return fmt.Errorf("you need to either provide a version or be connected to a Perses server")
		}

		health, err := apiClient.V1().Health().Check()
		if err != nil {
			return fmt.Errorf("can't retrieve version from Perses server: %v", err)
		}
		o.version = health.Version
	}
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	fmt.Printf("Starting DaC setup with Perses %s\n", o.version)

	// Create the destination folder
	os.MkdirAll(depsDstFolder, 0666)

	// Retrieve the Perses sources
	err := retrieveSources(o.version, o.verbose)
	if err != nil {
		return fmt.Errorf("error retrieving the Perses sources: %v", err)
	}

	// Extract the CUE deps from the archive to the destination folder
	err = extractCUEDepsToDst(o.version, o.verbose)
	if err != nil {
		return fmt.Errorf("error extracting the CUE dependencies: %v", err)
	}

	// Cleanup
	err = os.Remove(archiveName)
	if err != nil {
		return fmt.Errorf("error removing the temp archive: %v", err)
	}

	fmt.Println("DaC setup finished")

	return nil
}

func retrieveSources(version string, verbose bool) error {
	// Download the sources
	url := fmt.Sprintf("https://github.com/perses/perses/archive/refs/tags/v%s.tar.gz", version)

	response, err := http.Get(url)
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

	if verbose {
		fmt.Println("Perses release archive downloaded successfully")
	}

	return nil
}

func extractCUEDepsToDst(version string, verbose bool) error {
	file, err := os.Open(archiveName)
	if err != nil {
		return err
	}
	defer file.Close()

	// Open the gzip reader
	gzipReader, err := gzip.NewReader(file)
	if err != nil {
		return err
	}
	defer gzipReader.Close()

	// Open the tar reader
	tarReader := tar.NewReader(gzipReader)

	// Extract the CUE deps folder to the destination path
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		// Remove the wrapping folder for following evaluations
		depFilepath := removeFirstFolder(header.Name)

		if !strings.HasPrefix(depFilepath, depsParentFolder+"/") { // adding slash to avoid matching cue.mod dir
			continue
		}

		targetPath := depsDstFolder + "/" + depFilepath

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.Mkdir(targetPath, 0666); err != nil {
				return fmt.Errorf("can't create dir %s: %v", targetPath, err)
			}
			if verbose {
				fmt.Printf("dir %s created succesfully\n", targetPath)
			}
		case tar.TypeReg:
			outFile, err := os.Create(targetPath)
			if err != nil {
				return fmt.Errorf("can't create file %s: %v", targetPath, err)
			}
			defer outFile.Close()
			if _, err := io.Copy(outFile, tarReader); err != nil {
				return fmt.Errorf("can't copy content from %s: %v", header.Name, err)
			}
			if verbose {
				fmt.Printf("file %s extracted succesfully\n", targetPath)
			}
		default:
			return fmt.Errorf("unknown type: %b in %s", header.Typeflag, header.Name)
		}
	}

	return nil
}

func removeFirstFolder(filePath string) string {
	separatorChar := "/"

	// Split the path into individual components
	components := strings.Split(filePath, separatorChar)

	// Check if there is at least one folder in the path
	if len(components) > 1 {
		// Remove the first folder
		components = components[1:]
	}

	// Join the components back into a path
	resultPath := strings.Join(components, separatorChar)

	return resultPath
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
# If you are connected to a server simply run
percli dac setup

# If you are not, you need to provide the Perses version to consider for dependencies retrieval
percli dac setup --version 0.42.1
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.version, "version", "", "Version of Perses from which to retrieve the CUE dependencies.")
	cmd.Flags().BoolVar(&o.verbose, "verbose", false, "Enable verbose output")

	return cmd
}
