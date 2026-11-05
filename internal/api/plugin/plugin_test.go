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
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/module"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
)

func TestFilter(t *testing.T) {
	tests := []struct {
		title          string
		enabled        []string
		disabled       []string
		module         *v1.PluginModule
		isFiltered     bool
		expectedModule *v1.PluginModule
	}{
		{
			title: "no filter",
			module: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "foo",
							},
						},
					},
				},
			},
			isFiltered: false,
			expectedModule: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "foo",
							},
						},
					},
				},
			},
		},
		{
			title: "activated",
			enabled: []string{
				"foo",
			},
			module: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "foo",
							},
						},
					},
				},
			},
			isFiltered: false,
			expectedModule: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "foo",
							},
						},
					},
				},
			},
		},
		{
			title: "not activated",
			enabled: []string{
				"bar",
			},
			module: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "foo",
							},
						},
					},
				},
			},
			isFiltered: true,
			expectedModule: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{},
			},
		},
		{
			title: "activated but with less plugins",
			enabled: []string{
				"bar",
			},
			module: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "tartampion",
							},
						},
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "bar",
							},
						},
					},
				},
			},
			isFiltered: false,
			expectedModule: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "bar",
							},
						},
					},
				},
			},
		},
		{
			title: "deactivated",
			disabled: []string{
				"foo",
			},
			module: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "bar",
							},
						},
					},
				},
			},
			isFiltered: true,
			expectedModule: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "bar",
							},
						},
					},
				},
			},
		},
		{
			title: "deactivated with no plugins",
			disabled: []string{
				"bar",
			},
			module: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "bar",
							},
						},
					},
				},
			},
			isFiltered: true,
			expectedModule: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{},
			},
		},
		{
			title: "deactivated with less plugins",
			disabled: []string{
				"bar",
			},
			module: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "bar",
							},
						},
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "tartampion",
							},
						},
					},
				},
			},
			isFiltered: false,
			expectedModule: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "tartampion",
							},
						},
					},
				},
			},
		},
		{
			title: "not deactivated",
			disabled: []string{
				"tartampion",
			},
			module: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "bar",
							},
						},
					},
				},
			},
			isFiltered: false,
			expectedModule: &v1.PluginModule{
				Kind: v1.PluginModuleKind,
				Metadata: module.Metadata{
					Name: "foo",
				},
				Spec: v1.ModuleSpec{
					Plugins: []module.Plugin{
						{
							Kind: plugin.KindPanel,
							Spec: module.PluginSpec{
								Name: "bar",
							},
						},
					},
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			p := &pluginFile{
				enabled:  test.enabled,
				disabled: test.disabled,
			}
			result := p.filter(test.module)
			assert.Equal(t, test.expectedModule, test.module)
			assert.Equal(t, test.isFiltered, result)
		})
	}
}
