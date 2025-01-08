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

	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
)

const pluginFileName = "plugin-modules.json"

type Plugin interface {
	Load() error
	List() ([]byte, error)
	UnzipArchives()
	Schema() schema.Schema
}

func New(plugins config.Plugins) Plugin {
	return &pluginFile{
		path: plugins.Path,
		archibal: &arch{
			folder:       plugins.ArchivePath,
			targetFolder: plugins.Path,
		},
		sch: schema.New(),
	}
}

type pluginFile struct {
	path     string
	archibal *arch
	sch      schema.Schema
}

func (p *pluginFile) List() ([]byte, error) {
	pluginFilePath := filepath.Join(p.path, pluginFileName)
	return os.ReadFile(pluginFilePath)
}

func (p *pluginFile) Schema() schema.Schema {
	return p.sch
}

func (p *pluginFile) UnzipArchives() {
	if err := p.archibal.unzipAll(); err != nil {
		logrus.WithError(err).Error("unable to unzip archives")
	}
}

func (p *pluginFile) Load() error {
	files, err := os.ReadDir(p.path)
	if err != nil {
		return err
	}
	var pluginModuleList []v1.PluginModule
	for _, file := range files {
		if !file.IsDir() {
			// we are only interested in the plugin folder, so any files at the root of the plugin folder can be skipped
			continue
		}
		pluginPath := filepath.Join(p.path, file.Name())
		if valid, validErr := isPluginValid(pluginPath); !valid || validErr != nil {
			if validErr != nil {
				logrus.WithError(validErr).Error("unable to check if the plugin is valid")
			} else {
				logrus.Debugf("folder %q is not a valide plugin and is skept. Missing mandatory files", file.Name())
			}
			// We can ignore this folder, it's not a plugin, or the plugin is invalid.
			continue
		}
		manifest, readErr := ReadManifest(pluginPath)
		if readErr != nil {
			logrus.WithError(readErr).Error("unable to read plugin manifest")
			continue
		}
		npmPackageData, readErr := ReadPackage(pluginPath)
		if readErr != nil {
			logrus.WithError(readErr).Error("unable to read plugin package.json")
			continue
		}
		pluginModule := v1.PluginModule{
			Kind: v1.PluginModuleKind,
			Metadata: plugin.ModuleMetadata{
				Name:    manifest.Name,
				Version: manifest.Metadata.BuildInfo.Version,
			},
			Spec: npmPackageData.Perses,
		}
		// TODO with this current implementation, we cannot load a plugin that does not have a schema.
		//  We should probably add a flag to the plugin to indicate if it has a schema or not.
		if pluginSchemaLoadErr := p.sch.Load(pluginPath, pluginModule); pluginSchemaLoadErr != nil {
			logrus.WithError(pluginSchemaLoadErr).Error("unable to load plugin schema")
			continue
		}
		pluginModuleList = append(pluginModuleList, pluginModule)
	}
	if len(pluginModuleList) == 0 {
		pluginModuleList = make([]v1.PluginModule, 0)
	}
	marshalData, marshalErr := json.Marshal(pluginModuleList)
	if marshalErr != nil {
		return marshalErr
	}
	return os.WriteFile(filepath.Join(p.path, pluginFileName), marshalData, 0644) // nolint: gosec
}

func isPluginValid(pluginPath string) (bool, error) {
	// check if the plugin folder exists
	exist, err := isFileExist(pluginPath)
	if !exist || err != nil {
		return false, err
	}
	// check if the manifest file exists
	exist, err = isFileExist(filepath.Join(pluginPath, ManifestFileName))
	if !exist || err != nil {
		return false, err
	}
	// check if the package.json file exists
	exist, err = isFileExist(filepath.Join(pluginPath, PackageJSONFile))
	if !exist || err != nil {
		return false, err
	}
	return true, nil
}

func isFileExist(filePath string) (bool, error) {
	_, osErr := os.Stat(filePath)
	if osErr != nil {
		if errors.Is(osErr, os.ErrNotExist) {
			return false, nil
		}
		return false, osErr
	}
	return true, nil
}
