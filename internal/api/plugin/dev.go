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
	"fmt"

	apiinterface "github.com/perses/perses/internal/api/interface"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
)

func (p *pluginFile) LoadDevPlugin(plugins []v1.PluginInDevelopment) error {
	for _, plg := range plugins {
		devURL := plg.URL
		manifest, err := ReadManifestFromNetwork(devURL, plg.Name)
		if err != nil {
			return apiinterface.HandleBadRequestError(fmt.Sprintf("error reading manifest: %s", err))
		}
		npmPackageData, readErr := ReadPackageFromNetwork(devURL, plg.Name)
		if readErr != nil {
			return apiinterface.HandleBadRequestError(fmt.Sprintf("failed to load plugin package: %s", err))
		}
		pluginModule := v1.PluginModule{
			Kind: v1.PluginModuleKind,
			Metadata: plugin.ModuleMetadata{
				Name:    manifest.Name,
				Version: manifest.Metadata.BuildInfo.Version,
			},
			Spec: npmPackageData.Perses,
			Status: &plugin.ModuleStatus{
				IsLoaded: true,
				InDev:    true,
			},
		}
		pluginLoaded := &Loaded{
			DevEnvironment: &v1.PluginInDevelopment{
				Name:          plg.Name,
				URL:           devURL,
				DisableSchema: plg.DisableSchema,
				AbsolutePath:  plg.AbsolutePath,
			},
			Module: pluginModule,
		}
		if IsSchemaRequired(pluginModule.Spec) && !plg.DisableSchema {
			if pluginSchemaLoadErr := p.sch.LoadDevPlugin(plg.AbsolutePath, pluginModule); pluginSchemaLoadErr != nil {
				return apiinterface.HandleBadRequestError(fmt.Sprintf("failed to load plugin schema: %s", pluginSchemaLoadErr))
			}
			if pluginMigrateLoadErr := p.mig.LoadDevPlugin(plg.AbsolutePath, pluginModule); pluginMigrateLoadErr != nil {
				return apiinterface.HandleBadRequestError(fmt.Sprintf("failed to load plugin migration: %s", pluginMigrateLoadErr))
			}
		} else {
			logrus.Debugf("schema is disabled or not required for plugin %q", pluginModule.Metadata.Name)
		}
		p.mutex.Lock()
		p.devLoaded[manifest.Name] = pluginLoaded
		p.mutex.Unlock()
	}
	return p.storeLoadedList()
}

func (p *pluginFile) UnLoadDevPlugin(name string) error {
	plg, ok := p.devLoaded[name]
	if !ok {
		return apiinterface.HandleNotFoundError(fmt.Sprintf("plugin %q not found in development mode", name))
	}
	p.mutex.Lock()
	p.sch.UnloadDevPlugin(plg.Module)
	p.mig.UnLoadDevPlugin(plg.Module)
	delete(p.devLoaded, name)
	p.mutex.Unlock()
	return p.storeLoadedList()
}
