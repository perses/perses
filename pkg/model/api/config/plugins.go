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

	"github.com/perses/perses/pkg/model/api/v1/common"
)

const (
	DefaultPluginPath        = "plugins"
	DefaultArchivePluginPath = "plugins-archive"
)

func (f *Plugins) Verify() error {
	if len(f.Path) == 0 {
		f.Path = DefaultPluginPath
	}
	if len(f.ArchivePath) == 0 {
		f.ArchivePath = DefaultArchivePluginPath
	}
	return nil
}

// TODO : how to avoid user to know where the plugins are stored in the docker image
type Plugins struct {
	// Path is the path to the directory containing the runtime plugins
	Path           string                `json:"path,omitempty" yaml:"path,omitempty"`
	ArchivePath    string                `json:"archive_path,omitempty" yaml:"archive_path,omitempty"`
	DevEnvironment *PluginDevEnvironment `json:"dev_environment,omitempty" yaml:"dev_environment,omitempty"`
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
	Name         string      `json:"name" yaml:"name"`
	URL          *common.URL `json:"url,omitempty" yaml:"url,omitempty"`
	AbsolutePath string      `json:"absolute_path" yaml:"absolute_path"`
}

func (p *PluginInDevelopment) Verify() error {
	if len(p.Name) == 0 {
		return errors.New("the name of the plugin in development must be set")
	}
	if len(p.AbsolutePath) == 0 {
		return errors.New("the absolute path of the plugin in development must be set")
	}
	return nil
}
