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

const (
	defaultPluginPath        = "plugins"
	defaultArchivePluginPath = "plugins-archive"
)

func (f *Plugins) Verify() error {
	if len(f.Path) == 0 {
		f.Path = defaultPluginPath
	}
	if len(f.ArchivePath) == 0 {
		f.ArchivePath = defaultArchivePluginPath
	}
	return nil
}

type Plugins struct {
	// Path is the path to the directory containing the runtime plugins
	Path        string `json:"path,omitempty" yaml:"path,omitempty"`
	ArchivePath string `json:"archive_path,omitempty" yaml:"archive_path,omitempty"`
}
