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
	"errors"
	"os"
	"path/filepath"

	"github.com/perses/perses/pkg/model/api/config"
	"github.com/sirupsen/logrus"
)

const (
	PluginModuleKind = "PluginModule"
	pluginFileName   = "plugin-modules.json"
)

type PluginMetadata struct {
	PluginType string `json:"pluginType"`
	Kind       string `json:"kind"`
	Display    struct {
		Name        string `json:"name"`
		Description string `json:"description,omitempty"`
	} `json:"display"`
}

type PluginModuleSpec struct {
	Plugins []PluginMetadata `json:"plugins"`
}

type PluginModuleMetadata struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type PluginModule struct {
	Kind     string               `json:"kind"`
	Metadata PluginModuleMetadata `json:"metadata"`
	Spec     PluginModuleSpec     `json:"spec"`
}

type Plugin interface {
	List() ([]byte, error)
	UnzipArchives()
}

func New(plugins config.Plugins) Plugin {
	return &plugin{
		path: plugins.Path,
		archibal: &arch{
			folder:       plugins.ArchivePath,
			targetFolder: plugins.Path,
		},
	}
}

type plugin struct {
	path     string
	archibal *arch
}

func (p *plugin) List() ([]byte, error) {
	pluginFilePath := filepath.Join(p.path, pluginFileName)
	if _, osErr := os.Stat(pluginFilePath); errors.Is(osErr, os.ErrNotExist) {
		if generateErr := p.generatePluginListFile(); generateErr != nil {
			return nil, generateErr
		}
	}
	return os.ReadFile(pluginFilePath)
}

func (p *plugin) UnzipArchives() {
	if err := p.archibal.unzipAll(); err != nil {
		logrus.WithError(err).Error("unable to unzip archives")
	}
}

func (p *plugin) generatePluginListFile() error {
	files, err := os.ReadDir(p.path)
	if err != nil {
		return err
	}
	var pluginModuleList []PluginModule
	for _, file := range files {
		if !file.IsDir() {
			// we are only interested in the plugin folder, so any files at the root of the plugin folder can be skipped
			continue
		}
		// now we need to read the manifest file to extract the info we are interested
		if _, osErr := os.Stat(filepath.Join(p.path, file.Name(), ManifestFileName)); errors.Is(osErr, os.ErrNotExist) {
			// The manifest doesn't exist, so we can ignore this folder, it's not a plugin, or the plugin is invalid.
			logrus.Debugf("folder %q does not contain file mf-manifest.json, skipping it as it does not match the plugin architecture", file.Name())
			continue
		}
		manifest, readErr := ReadManifest(filepath.Join(p.path, file.Name()))
		if readErr != nil {
			logrus.WithError(readErr).Error("unable to read plugin manifest")
			continue
		}
		npmPackageData, readErr := ReadPackage(filepath.Join(p.path, file.Name()))
		if readErr != nil {
			logrus.WithError(readErr).Error("unable to read plugin package.json")
			continue
		}
		pluginModuleList = append(pluginModuleList, PluginModule{
			Kind: PluginModuleKind,
			Metadata: PluginModuleMetadata{
				Name:    manifest.Name,
				Version: manifest.Metadata.BuildInfo.Version,
			},
			Spec: PluginModuleSpec{
				Plugins: npmPackageData.Perses.Plugins,
			},
		})
	}
	if len(pluginModuleList) == 0 {
		pluginModuleList = make([]PluginModule, 0)
	}
	marshalData, marshalErr := json.Marshal(pluginModuleList)
	if marshalErr != nil {
		return marshalErr
	}
	return os.WriteFile(filepath.Join(p.path, pluginFileName), marshalData, 0644) // nolint: gosec
}
