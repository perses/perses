// Copyright 2025 The Perses Authors
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

package plugin

import (
	"errors"
	"os"
	"path/filepath"
)

// IsRequiredFileExists checks if the required files to make a plugin valid, are present in the given folders.
// frontendFolder is the folder where the frontend files are stored and special where the package.json is located.
// schemaFolder is the folder where the schema files are stored.
// distFolder is the folder where the result of the build of the frontend is stored.
// In case the plugin is coming from the archive built in a previous stage, then all paths will have the same value.
// In case we are validating a plugin in its repository, then the various folders in parameter will have different values depending on the struct of the repository.
func IsRequiredFileExists(frontendFolder string, schemaFolder string, distFolder string) (bool, error) {
	// check if the manifest file exists
	exist, err := fileExists(filepath.Join(distFolder, ManifestFileName))
	if !exist || err != nil {
		return false, err
	}
	// check if the package.json file exists
	exist, err = fileExists(filepath.Join(frontendFolder, PackageJSONFile))
	if !exist || err != nil {
		return false, err
	}
	// check if the schema folder exists
	exist, err = fileExists(schemaFolder)
	if !exist || err != nil {
		return false, err
	}
	return true, nil
}

func fileExists(filePath string) (bool, error) {
	_, osErr := os.Stat(filePath)
	if osErr != nil {
		if errors.Is(osErr, os.ErrNotExist) {
			return false, nil
		}
		return false, osErr
	}
	return true, nil
}
