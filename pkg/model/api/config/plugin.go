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

package config

import (
	"errors"
	"os"

	"github.com/perses/perses/pkg/model/api/v1/common"
)

const (
	DefaultPluginPath                   = "plugins"
	DefaultPluginPathInContainer        = "/etc/perses/plugins"
	DefaultArchivePluginPath            = "plugins-archive"
	DefaultArchivePluginPathInContainer = "/etc/perses/plugins-archive"
)

func isRunningInContainer() bool {
	// This file exists when podman is used
	if _, err := os.Stat("/run/.containerenv"); err == nil {
		return true
	}
	// This file exists when docker is used
	if _, err := os.Stat("/.dockerenv"); err == nil {
		return true
	}
	return false
}

type Plugin struct {
	// Path is the path to the directory containing the runtime plugins
	Path string `json:"path,omitempty" yaml:"path,omitempty"`
	// ArchivePath is the path to the directory containing the archived plugins
	// When Perses is starting, it will extract the content of the archive in the folder specified in the `folder` attribute.
	ArchivePath string `json:"archive_path,omitempty" yaml:"archive_path,omitempty"`
	// DevEnvironment is the configuration to use when developing a plugin
	DevEnvironment *PluginDevEnvironment `json:"dev_environment,omitempty" yaml:"dev_environment,omitempty"`
}

func (p *Plugin) Verify() error {
	runningInContainer := isRunningInContainer()
	if len(p.Path) == 0 {
		if runningInContainer {
			p.Path = DefaultPluginPathInContainer
		} else {
			p.Path = DefaultPluginPath
		}
	}
	if len(p.ArchivePath) == 0 {
		if runningInContainer {
			p.ArchivePath = DefaultArchivePluginPathInContainer
		} else {
			p.ArchivePath = DefaultArchivePluginPath
		}
	}
	return nil
}

type PluginDevEnvironment struct {
	URL     *common.URL           `json:"url,omitempty" yaml:"url,omitempty"`
	Plugins []PluginInDevelopment `json:"plugins" yaml:"plugins"`
}

func (p *PluginDevEnvironment) Verify() error {
	if p.URL == nil {
		p.URL = common.MustParseURL("http://localhost:3005")
	}
	if len(p.Plugins) == 0 {
		return errors.New("no plugins defined")
	}
	return nil
}

type PluginInDevelopment struct {
	// The name of the plugin in development
	Name string `json:"name" yaml:"name"`
	// DisableSchema is used to disable the schema validation of the plugin.
	// It is useful when the plugin is in development and the schema is not yet defined.
	DisableSchema bool `json:"disable_schema,omitempty" yaml:"disable_schema,omitempty"`
	// The URL of the development server hosting the plugin.
	// It is usually created by the command `rsbuild dev`.
	// If defined, it will override the URL defined in the `PluginDevEnvironment`.
	URL *common.URL `json:"url,omitempty" yaml:"url,omitempty"`
	// The absolute path to the plugin repository
	AbsolutePath string `json:"absolute_path" yaml:"absolute_path"`
}

func (p *PluginInDevelopment) Verify() error {
	if len(p.Name) == 0 {
		return errors.New("the name of the plugin in development must be set")
	}
	if len(p.AbsolutePath) == 0 && !p.DisableSchema {
		return errors.New("the absolute path of the plugin in development must be set to load the schema. Disable the schema if you don't want to load it")
	}
	return nil
}
