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
	"path/filepath"

	"github.com/perses/perses/internal/api/plugin/migrate"
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
	UnzipArchives() error
	Schema() schema.Schema
	Migration() migrate.Migration
}

func New(plugin config.Plugin) Plugin {
	sch := schema.New()
	mig := migrate.New()
	var dev *pluginDev
	if plugin.DevEnvironment != nil {
		dev = &pluginDev{
			cfg: *plugin.DevEnvironment,
			sch: sch,
			mig: mig,
		}
	}
	return &pluginFile{
		path: plugin.Path,
		archibal: &arch{
			folder:       plugin.ArchivePath,
			targetFolder: plugin.Path,
		},
		dev: dev,
		sch: sch,
		mig: mig,
	}
}

type pluginFile struct {
	path     string
	archibal *arch
	dev      *pluginDev
	sch      schema.Schema
	mig      migrate.Migration
}

func (p *pluginFile) List() ([]byte, error) {
	pluginFilePath := filepath.Join(p.path, pluginFileName)
	return os.ReadFile(pluginFilePath)
}

func (p *pluginFile) Schema() schema.Schema {
	return p.sch
}

func (p *pluginFile) Migration() migrate.Migration {
	return p.mig
}

func (p *pluginFile) UnzipArchives() error {
	return p.archibal.unzipAll()
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
		if valid, validErr := IsRequiredFileExists(pluginPath, pluginPath, pluginPath); !valid || validErr != nil {
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
		if !IsSchemaRequired(pluginModule.Spec) {
			logrus.Debugf("plugin %q does not require schema, so it will be skipped", pluginModule.Metadata.Name)
			continue
		}
		if pluginSchemaLoadErr := p.sch.Load(pluginPath, pluginModule); pluginSchemaLoadErr != nil {
			logrus.WithError(pluginSchemaLoadErr).Error("unable to load plugin schema")
			continue
		}
		if pluginMigrateLoadErr := p.mig.Load(pluginPath, pluginModule); pluginMigrateLoadErr != nil {
			logrus.WithError(pluginMigrateLoadErr).Error("unable to load plugin migration")
			continue
		}
		pluginModuleList = append(pluginModuleList, pluginModule)
	}
	if p.dev != nil {
		devPluginModuleList := p.dev.load()
		pluginModuleList = mergePluginModules(pluginModuleList, devPluginModuleList)
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

func mergePluginModules(prodModule, devModule []v1.PluginModule) []v1.PluginModule {
	if len(devModule) == 0 {
		return prodModule
	}
	if len(prodModule) == 0 {
		return devModule
	}
	prodModuleMap := make(map[string]v1.PluginModule)
	for _, module := range prodModule {
		prodModuleMap[module.Metadata.Name] = module
	}
	// Modules from dev environment are overriding the one from the production environment.
	// In production environment, we should not have any module from the dev environment.
	for _, module := range devModule {
		prodModuleMap[module.Metadata.Name] = module
	}
	var pluginModuleList []v1.PluginModule
	for _, module := range prodModuleMap {
		pluginModuleList = append(pluginModuleList, module)
	}
	return pluginModuleList
}
