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

package v1

import "github.com/perses/perses/pkg/model/api/v1/common"

const PluginModuleKind = "PluginModule"

type PluginSpec struct {
	Display *common.Display `json:"display"`
	Name    string          `json:"name"`
}

type Plugin struct {
	Kind string     `json:"kind"`
	Spec PluginSpec `json:"spec"`
}

type PluginModuleSpec struct {
	Plugins []Plugin `json:"plugins"`
}

type PluginModuleMetadata struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type PluginModule struct {
	Kind     string               `json:"kind"`
	Metadata PluginModuleMetadata `json:"metadata"`
	Spec     PluginModuleSpec     `json:"spec"`
}
