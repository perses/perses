// Copyright The Perses Authors
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
		// We are reading the manifest from the dev server, just to ensure it is present and reachable.
		// We don't use the manifest data as all info is already in the PluginInDevelopment struct.
		_, err := ReadManifestFromNetwork(devURL, plg.Name)
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
				Name:     plg.Name,
				Version:  plg.Version,
				Registry: plg.Registry,
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
		}
		p.mutex.Lock()
		p.devLoaded.Add(plg.Name, pluginModule.Metadata, pluginLoaded)
		p.mutex.Unlock()
		logrus.Debugf("plugin %q has been loaded in development mode", plg.Name)
	}
	return p.storeLoadedList()
}

func (p *pluginFile) RefreshDevPlugin(metadata plugin.ModuleMetadata) error {
	p.mutex.RLock()
	defer p.mutex.RUnlock()
	plg, ok := p.devLoaded.Get(metadata.Name, metadata)
	if !ok {
		return apiinterface.HandleNotFoundError(fmt.Sprintf("plugin %q not found in development mode", metadata.Name))
	}
	if !IsSchemaRequired(plg.Module.Spec) || plg.DevEnvironment.DisableSchema {
		logrus.Debugf("schema is disabled or not required for plugin %q", metadata.Name)
		return nil
	}
	if err := p.sch.LoadDevPlugin(plg.DevEnvironment.AbsolutePath, plg.Module); err != nil {
		return apiinterface.HandleBadRequestError(fmt.Sprintf("failed to refresh plugin schema: %s", err))
	}
	if err := p.mig.LoadDevPlugin(plg.DevEnvironment.AbsolutePath, plg.Module); err != nil {
		return apiinterface.HandleBadRequestError(fmt.Sprintf("failed to refresh plugin migration schema: %s", err))
	}
	logrus.Infof("plugin %q has been refreshed in development mode", metadata.Name)
	return nil
}

func (p *pluginFile) UnLoadDevPlugin(metadata plugin.ModuleMetadata) error {
	p.mutex.Lock()
	plg, ok := p.devLoaded.Get(metadata.Name, metadata)
	if !ok {
		p.mutex.Unlock()
		return apiinterface.HandleNotFoundError(fmt.Sprintf("plugin %q not found in development mode", metadata.Name))
	}
	p.sch.UnloadDevPlugin(plg.Module)
	p.mig.UnLoadDevPlugin(plg.Module)
	p.devLoaded.Remove(metadata.Name, metadata)
	p.mutex.Unlock()
	logrus.Debugf("plugin %q has been unloaded from development mode", metadata.Name)
	return p.storeLoadedList()
}
