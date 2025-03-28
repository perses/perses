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
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
)

const (
	ManifestFileName = "mf-manifest.json"
	PackageJSONFile  = "package.json"
)

type NPMPackage struct {
	Author     string            `json:"author"`
	Version    string            `json:"version"`
	Scripts    map[string]string `json:"scripts"`
	Workspaces []string          `json:"workspaces"`
	Perses     plugin.ModuleSpec `json:"perses"`
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
	manifestFilePath := filepath.Join(pluginPath, ManifestFileName)
	manifestData := &NPMManifest{}
	return manifestData, readFile(manifestFilePath, manifestData)
}

func ReadManifestFromNetwork(url *common.URL, pluginName string) (*NPMManifest, error) {
	manifestData := &NPMManifest{}
	return manifestData, readFileFromNetwork(url, pluginName, ManifestFileName, manifestData)
}

func ReadPackage(pluginPath string) (*NPMPackage, error) {
	packageFilePath := filepath.Join(pluginPath, PackageJSONFile)
	packageData := &NPMPackage{}
	return packageData, readFile(packageFilePath, packageData)
}

func ReadPackageFromNetwork(url *common.URL, pluginName string) (*NPMPackage, error) {
	packageData := &NPMPackage{}
	return packageData, readFileFromNetwork(url, pluginName, PackageJSONFile, packageData)
}

func readFile[T any](filePath string, result *T) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, result)
}

func readFileFromNetwork[T any](url *common.URL, pluginName string, fileName string, result *T) error {
	httpClient := http.DefaultClient
	httpRequest, err := prepareRequestToReadFileFromNetwork(url, pluginName, fileName)
	if err != nil {
		return err
	}
	resp, err := httpClient.Do(httpRequest)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, result)
}

func prepareRequestToReadFileFromNetwork(url *common.URL, pluginName string, fileName string) (*http.Request, error) {
	finalURL := common.NewURL(url, "plugins", pluginName, fileName)
	httpRequest, err := http.NewRequest(http.MethodGet, finalURL.String(), nil)
	if err != nil {
		return nil, err
	}
	httpRequest.Header.Set("Accept", "application/json")
	return httpRequest, nil
}
