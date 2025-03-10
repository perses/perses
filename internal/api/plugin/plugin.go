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
	"github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
)

const pluginFileName = "plugin-modules.json"

type Loaded struct {
	// DevEnvironment is set in case the plugin is loaded from a dev server
	DevEnvironment *config.PluginInDevelopment
	// The module loaded.
	Module v1.PluginModule
	// The local path to the plugin folder.
	LocalPath string
}

type Plugin interface {
	Load() error
	List() ([]byte, error)
	UnzipArchives() error
	GetLoadedPlugin(name string) (Loaded, bool)
	Schema() schema.Schema
	Migration() migrate.Migration
}

// StrictLoad is a helper function that loads the plugin from the default path.
// This function is used only for the tests.
// It should not be used in production.
// In case of error, the function will panic.
func StrictLoad() Plugin {
	projectPath := test.GetRepositoryPath()
	cfg := config.Plugin{
		Path:        filepath.Join(projectPath, config.DefaultPluginPath),
		ArchivePath: filepath.Join(projectPath, config.DefaultArchivePluginPath),
	}
	pluginService := New(cfg)
	if err := pluginService.UnzipArchives(); err != nil {
		logrus.Fatal(err)
	}
	if err := pluginService.Load(); err != nil {
		logrus.Fatal(err)
	}
	return pluginService
}

func New(cfg config.Plugin) Plugin {
	return &pluginFile{
		path: cfg.Path,
		archibal: &arch{
			folder:       cfg.ArchivePath,
			targetFolder: cfg.Path,
		},
		sch:            schema.New(),
		mig:            migrate.New(),
		loaded:         make(map[string]Loaded),
		devEnvironment: cfg.DevEnvironment,
	}
}

type pluginFile struct {
	// path is the local path where the plugins are stored.
	path string
	// loaded is a map that contains all the loaded plugin modules.
	// The key is the name of the plugin used by the frontend to get access to the plugin files.
	loaded map[string]Loaded
	// archibal is the archive service used only to extract the plugin files from the archive.
	archibal *arch
	// sch is the service used to load and provide the schema of the plugin.
	// This service is used when validating any plugin / dashboards.
	sch schema.Schema
	// mig is the service used to load and provide the migration schema of the plugin.
	// This service is used when migrating the plugin from Grafana to Perses.
	mig            migrate.Migration
	devEnvironment *config.PluginDevEnvironment
}

func (p *pluginFile) List() ([]byte, error) {
	pluginFilePath := filepath.Join(p.path, pluginFileName)
	return os.ReadFile(pluginFilePath)
}

func (p *pluginFile) GetLoadedPlugin(prefixURI string) (Loaded, bool) {
	loaded, ok := p.loaded[prefixURI]
	return loaded, ok
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
	for _, file := range files {
		if !file.IsDir() {
			// we are only interested in the plugin folder, so any files at the root of the plugin folder can be skipped
			continue
		}
		pluginPath := filepath.Join(p.path, file.Name())
		if validErr := IsRequiredFileExists(pluginPath, pluginPath, pluginPath); validErr != nil {
			logrus.WithError(validErr).Errorf("folder %q is not a valid plugin and is skipped. Missing mandatory files", file.Name())
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
		pluginLoaded := Loaded{
			DevEnvironment: nil,
			Module:         pluginModule,
			LocalPath:      pluginPath,
		}
		if IsSchemaRequired(pluginModule.Spec) {
			if pluginSchemaLoadErr := p.sch.Load(pluginPath, pluginModule); pluginSchemaLoadErr != nil {
				logrus.WithError(pluginSchemaLoadErr).Error("unable to load plugin schema")
				continue
			}
			if pluginMigrateLoadErr := p.mig.Load(pluginPath, pluginModule); pluginMigrateLoadErr != nil {
				logrus.WithError(pluginMigrateLoadErr).Error("unable to load plugin migration")
				continue
			}
		}
		p.loaded[manifest.Name] = pluginLoaded
	}
	if p.devEnvironment != nil {
		p.loadDevPlugin()
	}
	return p.storeLoadedList()
}

func (p *pluginFile) storeLoadedList() error {
	var pluginModuleList []v1.PluginModule
	for _, l := range p.loaded {
		pluginModuleList = append(pluginModuleList, l.Module)
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
