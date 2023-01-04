// Copyright 2023 The Perses Authors
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

import { PluginModuleResource } from './plugins';

/**
 * A component capable of loading the resource/metadata for all available plugins, then loading individual plugins for
 * those resources on-demand.
 */
export interface PluginLoader {
  getInstalledPlugins: () => Promise<PluginModuleResource[]>;
  importPluginModule: (resource: PluginModuleResource) => Promise<unknown>;
}

/**
 * The dynamic import for a single plugin resource.
 */
export interface DynamicImportPlugin {
  resource: PluginModuleResource;
  importPlugin(): Promise<unknown>;
}

/**
 * A PluginLoader for the common pattern in Perses where we eagerly import a plugin's resource file, and then lazy load
 * the plugin itself via a dynamic `import()` statement.
 */
export function dynamicImportPluginLoader(plugins: DynamicImportPlugin[]): PluginLoader {
  const importMap: Map<PluginModuleResource, DynamicImportPlugin['importPlugin']> = new Map(
    plugins.map((plugin) => [plugin.resource, plugin.importPlugin])
  );

  return {
    async getInstalledPlugins() {
      return Promise.resolve(Array.from(importMap.keys()));
    },
    importPluginModule(resource) {
      const importFn = importMap.get(resource);
      if (importFn === undefined) {
        throw new Error('Plugin not found');
      }
      return importFn();
    },
  };
}
