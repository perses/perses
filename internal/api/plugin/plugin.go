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
	"sync"

	"github.com/perses/perses/internal/api/plugin/migrate"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
)

const pluginFileName = "plugin-modules.json"

type Loaded struct {
	// DevEnvironment is set in case the plugin is loaded from a dev server
	DevEnvironment *v1.PluginInDevelopment
	// The module loaded.
	Module v1.PluginModule
	// The local path to the plugin folder.
	LocalPath string
}

type Plugin interface {
	Load() error
	LoadDevPlugin(plugins []v1.PluginInDevelopment) error
	RefreshDevPlugin(name string) error
	UnLoadDevPlugin(name string) error
	List() ([]byte, error)
	UnzipArchives() error
	GetLoadedPlugin(name string) (*Loaded, bool)
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
		sch:       schema.New(),
		mig:       migrate.New(),
		loaded:    make(map[string]*Loaded),
		devLoaded: make(map[string]*Loaded),
	}
}

type pluginFile struct {
	// path is the local path where the plugins are stored.
	path string
	// loaded is a map that contains all the loaded plugin modules.
	// The key is the name of the plugin used by the frontend to get access to the plugin files.
	loaded map[string]*Loaded
	// devLoaded is a map that contains all the loaded plugin modules in development mode.
	devLoaded map[string]*Loaded
	// archibal is the archive service used only to extract the plugin files from the archive.
	archibal *arch
	// sch is the service used to load and provide the schema of the plugin.
	// This service is used when validating any plugin / dashboards.
	sch schema.Schema
	// mig is the service used to load and provide the migration schema of the plugin.
	// This service is used when migrating the plugin from Grafana to Perses.
	mig migrate.Migration
	// mutex will protect the loaded map.
	mutex sync.RWMutex
}

func (p *pluginFile) List() ([]byte, error) {
	pluginFilePath := filepath.Join(p.path, pluginFileName)
	exist, err := file.Exists(pluginFilePath)
	if err != nil {
		return nil, err
	}
	if !exist {
		logrus.Warnf("unable to list plugins, plugin file %s does not exist", pluginFilePath)
		// if the file does not exist, we return an empty file
		return []byte("[]"), nil
	}
	return os.ReadFile(pluginFilePath) //nolint: gosec
}

func (p *pluginFile) GetLoadedPlugin(name string) (*Loaded, bool) {
	p.mutex.RLock()
	defer p.mutex.RUnlock()
	// Check in the dev plugin first
	if devLoaded, ok := p.devLoaded[name]; ok {
		return devLoaded, true
	}
	loaded, ok := p.loaded[name]
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
	for _, f := range files {
		if !f.IsDir() {
			// we are only interested in the plugin folder, so any files at the root of the plugin folder can be skipped
			continue
		}
		pluginPath := filepath.Join(p.path, f.Name())
		pluginModule := p.loadSinglePlugin(f, pluginPath)
		if pluginModule == nil {
			// the plugin is not valid, we can skip it
			continue
		}
		pluginLoaded := &Loaded{
			DevEnvironment: nil,
			Module:         *pluginModule,
			LocalPath:      pluginPath,
		}
		p.mutex.Lock()
		p.loaded[pluginModule.Metadata.Name] = pluginLoaded
		p.mutex.Unlock()
	}
	return p.storeLoadedList()
}

func (p *pluginFile) loadSinglePlugin(file os.DirEntry, pluginPath string) *v1.PluginModule {
	if validErr := IsRequiredFileExists(pluginPath, pluginPath, pluginPath); validErr != nil {
		logrus.WithError(validErr).Errorf("folder %q is not a valid plugin and is skipped. Missing mandatory files", file.Name())
		// We can ignore this folder, it's not a plugin, or the plugin is invalid.
		return nil
	}
	manifest, readErr := ReadManifest(pluginPath)
	if readErr != nil {
		logrus.WithError(readErr).Error("unable to read plugin manifest")
		return nil
	}

	pluginStatus := &plugin.ModuleStatus{
		IsLoaded: true,
		InDev:    false,
	}

	pluginModule := &v1.PluginModule{
		Kind: v1.PluginModuleKind,
		Metadata: plugin.ModuleMetadata{
			Name:    manifest.Name,
			Version: manifest.Metadata.BuildInfo.Version,
		},
		Status: pluginStatus,
	}

	npmPackageData, readErr := ReadPackage(pluginPath)
	if readErr != nil {
		pluginStatus.IsLoaded = false
		pluginStatus.Error = "unable to read plugin package.json"
		logrus.WithError(readErr).Error(pluginStatus.Error)
		return pluginModule
	}
	pluginModule.Spec = npmPackageData.Perses

	if IsSchemaRequired(pluginModule.Spec) {
		if pluginSchemaLoadErr := p.sch.Load(pluginPath, *pluginModule); pluginSchemaLoadErr != nil {
			pluginStatus.IsLoaded = false
			pluginStatus.Error = "unable to load plugin schema"
			logrus.WithError(pluginSchemaLoadErr).Error(pluginStatus.Error)
			return pluginModule
		}
		if pluginMigrateLoadErr := p.mig.Load(pluginPath, *pluginModule); pluginMigrateLoadErr != nil {
			pluginStatus.IsLoaded = false
			pluginStatus.Error = "unable to load plugin migration"
			logrus.WithError(pluginMigrateLoadErr).Error(pluginStatus.Error)
			return pluginModule
		}
	}
	return pluginModule
}

func (p *pluginFile) storeLoadedList() error {
	p.mutex.RLock()
	defer p.mutex.RUnlock()
	var pluginModuleList []v1.PluginModule
	mergeMap := make(map[string]*Loaded)
	for _, l := range p.loaded {
		mergeMap[l.Module.Metadata.Name] = l
	}
	for _, l := range p.devLoaded {
		mergeMap[l.Module.Metadata.Name] = l
	}
	for _, l := range mergeMap {
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
