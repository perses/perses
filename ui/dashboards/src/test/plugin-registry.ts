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
import {
  PluginModule,
  PluginRegistryProps,
  PluginResource,
  PluginSetupFunction,
  RegisterPlugin,
} from '@perses-dev/plugin-system';

/**
 * Helper for mocking `PluginRegistry` data during tests. Returns props that can be spread on the `PluginRegistry`
 * component so that it will load the mock plugins you setup. You can use the `addMockPlugin` function that's returned
 * to add mock plugins before rendering components that use them.
 */
export function mockPluginRegistryProps() {
  const mockPluginResource: PluginResource = {
    kind: 'Plugin',
    metadata: {
      name: 'Fake Plugin for Tests',
    },
    spec: {
      supported_kinds: {},
    },
  };

  // Allow adding mock plugins in tests
  const mockSetupFunctions: PluginSetupFunction[] = [];
  const addMockPlugin: RegisterPlugin = (config) => {
    mockPluginResource.spec.supported_kinds[config.kind] = config.pluginType;
    mockSetupFunctions.push((registerPlugin) => {
      registerPlugin(config);
    });
  };

  // Our mock plugin module just calls all the setup functions that were added
  const mockPluginModule: PluginModule = {
    setup(registerPlugin) {
      for (const setup of mockSetupFunctions) {
        setup(registerPlugin);
      }
    },
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
