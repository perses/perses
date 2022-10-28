// Copyright 2022 The Perses Authors
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

import { UnknownSpec } from '@perses-dev/core';
import {
  PluginRegistryProps,
  PluginModuleResource,
  PluginImplementation,
  PluginType,
  Plugin,
} from '@perses-dev/plugin-system';

/**
 * Helper for mocking `PluginRegistry` data during tests. Returns props that can be spread on the `PluginRegistry`
 * component so that it will load the mock plugins you setup. You can use the `addMockPlugin` function that's returned
 * to add mock plugins before rendering components that use them.
 */
export function mockPluginRegistryProps() {
  const mockPluginResource: PluginModuleResource = {
    kind: 'PluginModule',
    metadata: {
      name: 'Fake Plugin Module for Tests',
      created_at: '',
      updated_at: '',
      version: 0,
    },
    spec: {
      plugins: [],
    },
  };

  const mockPluginModule: Record<string, Plugin<UnknownSpec>> = {};

  // Allow adding mock plugins in tests
  const addMockPlugin = <T extends PluginType>(pluginType: T, kind: string, plugin: PluginImplementation<T>) => {
    mockPluginResource.spec.plugins.push({
      pluginType,
      kind,
      display: {
        name: `Fake ${pluginType} Plugin for ${kind}`,
      },
    });

    // "Export" on the module under the same name as the kind the plugin handles
    mockPluginModule[kind] = plugin;
  };

  const pluginRegistryProps: Omit<PluginRegistryProps, 'children'> = {
    getInstalledPlugins() {
      return Promise.resolve([mockPluginResource]);
    },
    importPluginModule(/* resource */) {
      return Promise.resolve(mockPluginModule);
    },
  };

  return {
    pluginRegistryProps,
    addMockPlugin,
  };
}
