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

package fakev1

import (
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	pluginModel "github.com/perses/perses/pkg/model/api/v1/plugin"
)

type plugin struct {
	v1.PluginInterface
}

func (c *plugin) List() ([]modelV1.PluginModule, error) {
	return []modelV1.PluginModule{
		{
			Kind: "PluginModule",
			Metadata: pluginModel.ModuleMetadata{
				Name:    "plugin1",
				Version: "v0.1.0",
			},
			Spec: pluginModel.ModuleSpec{
				Plugins: []pluginModel.Plugin{
					{
						Kind: pluginModel.KindPanel,
					},
				},
			},
			Status: &pluginModel.ModuleStatus{
				IsLoaded: true,
				InDev:    false,
			},
		},
	}, nil
}
