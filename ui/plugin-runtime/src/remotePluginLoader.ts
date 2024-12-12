import { PluginLoader } from '@perses-dev/plugin-system';
import { loadPlugin } from './PluginRuntime';

export const remotePluginLoader = (baseURL?: string): PluginLoader => {
  return {
    getInstalledPlugins: async () => {
      const pluginsResponse = await fetch(`${baseURL ? baseURL : ''}/api/v1/plugins`);

      const plugins = await pluginsResponse.json();

      const pluginModules = plugins.map((plugin: Record<string, unknown>) => {
        return {
          kind: 'PluginModule',
          metadata: {
            name: plugin.name,
            version: plugin.version,
          },
          spec: {
            plugins: plugin.plugins,
          },
        };
      });

      console.log(pluginModules);

      return pluginModules;
    },
    importPluginModule: async (resource) => {
      const pluginModuleName = resource.metadata.name;

      const pluginModule: Record<string, unknown> = {};

      for (const plugin of resource.spec.plugins) {
        const loadedPlugin = await loadPlugin(pluginModuleName, plugin.kind);

        pluginModule[plugin.kind] = loadedPlugin;
      }

      console.log('loading plugin module', pluginModuleName);

      return pluginModule;
    },
  };
};
