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

import { PluginLoader, PluginMetadata, PluginModuleResource } from '@perses-dev/plugin-system';
import { RemotePluginModule } from './PersesPlugin.types';
import { loadPlugin } from './PluginRuntime';

const isPluginMetadata = (plugin: unknown): plugin is PluginMetadata => {
  return (
    typeof plugin === 'object' &&
    plugin !== null &&
    'kind' in plugin &&
    'spec' in plugin &&
    typeof plugin.spec === 'object' &&
    plugin.spec !== null &&
    'name' in plugin.spec
  );
};

const isPluginModuleResource = (pluginModule: unknown): pluginModule is PluginModuleResource => {
  return (
    typeof pluginModule === 'object' &&
    pluginModule !== null &&
    'metadata' in pluginModule &&
    'spec' in pluginModule &&
    typeof pluginModule.spec === 'object' &&
    pluginModule.spec !== null &&
    'plugins' in pluginModule.spec &&
    Array.isArray(pluginModule.spec.plugins) &&
    pluginModule.spec.plugins.every(isPluginMetadata)
  );
};

type RemotePluginLoaderOptions = {
  /**
   * The API path for fetching available Perses plugins. Used to construct the full URL to the `/api/v1/plugins` endpoint.
   * @default ''
   **/
  apiPrefix?: string;
  /**
   * The base URL for loading plugin assets (e.g., JavaScript files). Used to construct the full URL to the `/plugins` directory
   * @default ''
   **/
  baseURL?: string;
};

type ParsedPluginOptions = {
  pluginsApiPath: string;
  pluginsAssetsPath: string;
};

const DEFAULT_PLUGINS_API_PATH = '/api/v1/plugins';
const DEFAULT_PLUGINS_ASSETS_PATH = '/plugins';

const paramToOptions = (options?: RemotePluginLoaderOptions): ParsedPluginOptions => {
  if (options === undefined) {
    return {
      pluginsApiPath: DEFAULT_PLUGINS_API_PATH,
      pluginsAssetsPath: DEFAULT_PLUGINS_ASSETS_PATH,
    };
  }

  return {
    pluginsApiPath: `${options?.apiPrefix ?? ''}${DEFAULT_PLUGINS_API_PATH}`,
    pluginsAssetsPath: `${options?.baseURL ?? ''}${DEFAULT_PLUGINS_ASSETS_PATH}`,
  };
};

/**
 * Get a PluginLoader that fetches the list of installed plugins from a remote server and loads them as needed.
 * @param options - Optional configuration options for the remote plugin loader.
 */
export function remotePluginLoader(options?: RemotePluginLoaderOptions): PluginLoader {
  const { pluginsApiPath, pluginsAssetsPath } = paramToOptions(options);

  return {
    getInstalledPlugins: async (): Promise<PluginModuleResource[]> => {
      const pluginsResponse = await fetch(pluginsApiPath);

      const plugins = await pluginsResponse.json();

      let pluginModules: PluginModuleResource[] = [];

      if (Array.isArray(plugins)) {
        pluginModules = plugins.filter(isPluginModuleResource);
      } else {
        console.error('RemotePluginLoader: Error loading plugins, response is not an array');
      }

      if (!pluginModules.length) {
        console.error('RemotePluginLoader: No valid plugins found');
      }

      return pluginModules;
    },
    importPluginModule: async (resource): Promise<RemotePluginModule> => {
      const pluginModuleName = resource.metadata.name;

      const pluginModule: RemotePluginModule = {};

      for (const plugin of resource.spec.plugins) {
        const remotePluginModule = await loadPlugin(pluginModuleName, plugin.spec.name, pluginsAssetsPath);

        const remotePlugin = remotePluginModule?.[plugin.spec.name];
        if (remotePlugin) {
          pluginModule[plugin.spec.name] = remotePlugin;
        } else {
          console.error(`RemotePluginLoader: Error loading plugin ${plugin.spec.name}`);
        }
      }

      return pluginModule;
    },
  };
}
