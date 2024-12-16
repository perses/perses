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

package plugin

import (
	"encoding/json"
	"os"
	"path"
)

const (
	ManifestFileName = "mf-manifest.json"
	PackageJSONFile  = "package.json"
)

type NPMPerses struct {
	Plugins []PluginMetadata `json:"plugins"`
}

type NPMPackage struct {
	Author  string    `json:"author"`
	Version string    `json:"version"`
	Perses  NPMPerses `json:"perses"`
}

type BuildInfo struct {
	Version string `json:"buildVersion"`
	Name    string `json:"buildName"`
}

type ManifetsMetadata struct {
	BuildInfo BuildInfo `json:"buildInfo"`
}

type NPMManifest struct {
	ID       string           `json:"id"`
	Name     string           `json:"name"`
	Metadata ManifetsMetadata `json:"metaData"`
}

func ReadManifest(pluginPath string) (*NPMManifest, error) {
	manifestFilePath := path.Join(pluginPath, ManifestFileName)
	manifestData := &NPMManifest{}
	return manifestData, readFile(manifestFilePath, manifestData)
}

func ReadPackage(pluginPath string) (*NPMPackage, error) {
	packageFilePath := path.Join(pluginPath, PackageJSONFile)
	packageData := &NPMPackage{}
	return packageData, readFile(packageFilePath, packageData)
}

func readFile[T any](filePath string, result *T) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, result)
}
