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
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/sirupsen/logrus"
)

const (
	archiveName        = "sources.tar.gz"
	cueDepsFolderName  = "cue/"
	cueDepsRootDstPath = "cue.mod/pkg/github.com/perses/perses" // for more info see https://cuelang.org/docs/concepts/packages/
	maxFileSize        = 10240                                  // = 10 KiB. Estimated max size for CUE files. Limit required by gosec.
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
		header, tarErr := tarReader.Next()
		if tarErr == io.EOF {
			break
		}
		if tarErr != nil {
			return tarErr
		}

		// Remove the wrapping folder for following evaluations
		currentDepPath := removeFirstFolder(header.Name)

		if currentDepPath == cueDepsFolderName {
			depsFolderFound = true
		}
		if !strings.HasPrefix(currentDepPath, cueDepsFolderName) {
			continue
		}

		newDepPath := fmt.Sprintf("%s/%s", cueDepsFolderName, currentDepPath)

		switch header.Typeflag {
		case tar.TypeDir:
			if folderErr := os.Mkdir(newDepPath, 0666); err != nil {
				return fmt.Errorf("can't create dir %s: %v", newDepPath, folderErr)
			}
			logrus.Debugf("dir %s created succesfully", newDepPath)
		case tar.TypeReg:
			outFile, createErr := os.Create(newDepPath)
			if createErr != nil {
				return fmt.Errorf("can't create file %s: %v", newDepPath, createErr)
			}
			defer outFile.Close()
			if _, copyErr := io.CopyN(outFile, tarReader, maxFileSize); copyErr != nil {
				if copyErr == io.EOF {
					continue
				}
				return fmt.Errorf("can't copy content from %s: %v", header.Name, copyErr)
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

func (o *option) setupCue() error {
	// Create the destination folder for the dependencies
	if err := os.MkdirAll(cueDepsRootDstPath, os.ModePerm); err != nil {
		return fmt.Errorf("error creating the dependencies folder structure: %v", err)
	}

	// Download the source code from the provided Perses version
	if err := o.downloadSources(); err != nil {
		return fmt.Errorf("error retrieving the Perses sources: %v", err)
	}

	defer func() {
		// Cleanup
		if err := os.Remove(archiveName); err != nil {
			fmt.Printf("error removing the temp archive: %v\n", err)
		}
	}()

	// Extract the CUE deps from the archive to the destination folder
	if err := extractCUEDepsToDst(); err != nil {
		return fmt.Errorf("error extracting the CUE dependencies: %v", err)
	}
	return nil
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
