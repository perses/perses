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

package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/sirupsen/logrus"
)

// These constants are actually defined as variables to allow overriding them at build time using the -ldflags option.
// It is useful for the Linux distribution that has different conventions for the location of the data files.
// See https://github.com/perses/perses/issues/2947 for more context.
var (
	DefaultPluginPath                   = "plugins"
	DefaultPluginPathInContainer        = "/etc/perses/plugins"
	DefaultArchivePluginPath            = "plugins-archive"
	DefaultArchivePluginPathInContainer = "/etc/perses/plugins-archive"
)

func isFileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

type Plugin struct {
	// Path is the path to the directory containing the runtime plugins
	Path string `json:"path,omitempty" yaml:"path,omitempty"`
	// ArchivePath is the path to the directory containing the archived plugins
	// When Perses is starting, it will extract the content of the archive in the folder specified in the `folder` attribute.
	// DEPRECATED: This attribute is deprecated and will be removed in a future version. It is still supported for backward compatibility, but it is recommended to use the `archive_paths` attribute instead.
	ArchivePath string `json:"archive_path,omitempty" yaml:"archive_path,omitempty"`
	// ArchivePaths is the list of paths to the directories containing the archived plugins. It allows to specify multiple directories for the archived plugins.
	// When Perses is starting, it will extract any archive found in the folders specified in this attribute in the folder specified in the `path` attribute.
	ArchivePaths []string `json:"archive_paths,omitempty" yaml:"archive_paths,omitempty"`
	// DevEnvironment is the configuration to use when developing a plugin
	EnableDev bool `json:"enable_dev" yaml:"enable_dev"`
	// Enabled is a list of plugin activated. Leave empty if you want to activate all plugins found in the `path` directory.
	// If not empty, only the plugins whose name is in this list will be activated.
	// The name can be the name of the plugin or the name of the module. For example, you can put `Prometheus` to enable the Prometheus module that contains query, variables and datasource plugin.
	// Use either Enabled or Disabled. Both can not be used at the same time.
	Enabled []string `json:"enabled,omitempty" yaml:"enabled,omitempty"`
	// Disabled is a list of plugin deactivated. Leave empty if you want to activate all plugins found in the `path` directory.
	// If not empty, the plugins whose name is in this list will be deactivated.
	// The name can be the name of the plugin or the name of the module. For example, you can put `Prometheus` to disable the Prometheus module that contains query, variables and datasource plugin.
	// Use either Enabled or Disabled. Both can not be used at the same time.
	Disabled []string `json:"disabled,omitempty" yaml:"disabled,omitempty"`
}

func (p *Plugin) Verify() error {
	// Initially, to determine the default paths, we were trying to check if the binary was running in a container.
	// However, it was not reliable enough, there were cases where the binary was running in a container, but our checks failed.
	// So now we just check if the default paths exist, and if they do, we use them as defaults.
	// The fact Perses is running in a container is not useful information for the plugin configuration.
	// The fact the path where the plugin is stored exists is more relevant.
	if len(p.Path) == 0 {
		if isFileExists(DefaultPluginPathInContainer) {
			p.Path = DefaultPluginPathInContainer
		} else {
			p.Path = DefaultPluginPath
		}
	}
	if len(p.ArchivePath) > 0 {
		logrus.Warn("the 'archive_path' attribute is deprecated and will be removed in a future version. Please use the 'archive_paths' attribute instead")
		p.ArchivePaths = append(p.ArchivePaths, p.ArchivePath)
		p.ArchivePath = ""
	}
	if len(p.ArchivePaths) == 0 {
		if isFileExists(DefaultArchivePluginPathInContainer) {
			p.ArchivePaths = append(p.ArchivePaths, DefaultArchivePluginPathInContainer)
		} else {
			p.ArchivePaths = append(p.ArchivePaths, DefaultArchivePluginPath)
		}
	}
	if len(p.Enabled) > 0 && len(p.Disabled) > 0 {
		return fmt.Errorf("the 'activated' and 'deactivated' attributes can not be used at the same time. Please use either one of them")
	}
	if len(p.Enabled) > 0 {
		newEnabled := make([]string, 0, len(p.Enabled))
		for _, s := range p.Enabled {
			newEnabled = append(newEnabled, strings.ToLower(s))
		}
		p.Enabled = newEnabled
	}
	if len(p.Disabled) > 0 {
		newDisabled := make([]string, 0, len(p.Disabled))
		for _, s := range p.Disabled {
			newDisabled = append(newDisabled, strings.ToLower(s))
		}
		p.Disabled = newDisabled
	}
	return nil
}
