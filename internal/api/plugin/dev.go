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
	"github.com/perses/perses/internal/api/plugin/migrate"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
)

type pluginDev struct {
	cfg config.PluginDevEnvironment
	sch schema.Schema
	mig migrate.Migration
}

func (p *pluginDev) load() []v1.PluginModule {
	var pluginModuleList []v1.PluginModule
	for _, plg := range p.cfg.Plugins {
		manifest, err := ReadManifestFromNetwork(p.cfg.URL, plg.Name)
		if err != nil {
			logrus.WithError(err).Error("failed to load plugin manifest")
			continue
		}
		npmPackageData, readErr := ReadPackageFromNetwork(p.cfg.URL, plg.Name)
		if readErr != nil {
			logrus.WithError(readErr).Error("failed to load plugin package")
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
		if pluginSchemaLoadErr := p.sch.Load(plg.AbsolutePath, pluginModule); pluginSchemaLoadErr != nil {
			logrus.WithError(pluginSchemaLoadErr).Error("unable to load plugin schema")
			continue
		}
		if pluginMigrateLoadErr := p.mig.Load(plg.AbsolutePath, pluginModule); pluginMigrateLoadErr != nil {
			logrus.WithError(pluginMigrateLoadErr).Error("unable to load plugin migration")
			continue
		}
		pluginModuleList = append(pluginModuleList, pluginModule)
	}
	return pluginModuleList
}
