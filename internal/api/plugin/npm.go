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
	manifestFileName = "mf-manifest.json"
	packageJSONFile  = "package.json"
)

type npmPerses struct {
	PluginType string `json:"pluginType"`
}

type npmPackage struct {
	Author  string    `json:"author"`
	Version string    `json:"version"`
	Perses  npmPerses `json:"perses"`
}

type buildInfo struct {
	Version string `json:"buildVersion"`
	Name    string `json:"buildName"`
}

type metadata struct {
	BuildInfo buildInfo `json:"buildInfo"`
}

type npmManifest struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Metadata metadata `json:"metaData"`
}

func readManifest(pluginPath string) (*npmManifest, error) {
	manifestFilePath := path.Join(pluginPath, manifestFileName)
	manifestData := &npmManifest{}
	return manifestData, readFile(manifestFilePath, manifestData)
}

func readPackage(pluginPath string) (*npmPackage, error) {
	packageFilePath := path.Join(pluginPath, packageJSONFile)
	packageData := &npmPackage{}
	return packageData, readFile(packageFilePath, packageData)
}

func readFile[T any](filePath string, result *T) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, result)
}
