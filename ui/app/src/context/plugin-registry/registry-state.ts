import { useCallback, useMemo, useRef } from 'react';
import { useImmer } from 'use-immer';
import {
  PluginRegistrationConfig,
  PluginModule,
  PluginResource,
  RegisterPlugin,
  PluginType,
  AnyPluginImplementation,
  JsonObject,
} from '@perses-ui/core';
import { BUNDLED_PLUGINS } from './bundled-plugins';
import {
  createChartQueryPlugin,
  createPanelPlugin,
  createVariablePlugin,
} from './create-plugin';

// Given a PluginType and Kind, return the associated Plugin that can be loaded
export type PluginResourcesByTypeAndKind = {
  [K in PluginType]: Map<string, PluginResource>;
};

// Once a plugin is registered, it's stored by plugin type and kind
export type LoadedPluginsByTypeAndKind = {
  [Type in PluginType]: Map<string, AnyPluginImplementation<Type>>;
};

/**
 * Hook for setting up plugin registry state. Returns the state, plus a function
 * for registering plugins with that state.
 */
export function useRegistryState(installedPlugins: PluginResource[]) {
  // Go through all installed plugins and bundled plugins and build an index of
  // those resources by type and kind
  const loadablePlugins = useMemo(() => {
    const loadableProps: PluginResourcesByTypeAndKind = {
      Variable: new Map(),
      Panel: new Map(),
      ChartQuery: new Map(),
    };

    const addToLoadable = (resource: PluginResource) => {
      const supportedKinds = resource.spec.supported_kinds;
      for (const kind in supportedKinds) {
        const pluginType = supportedKinds[kind];
        if (pluginType === undefined) continue;

        const map = loadableProps[pluginType];
        if (map.has(kind)) {
          console.warn(
            `Got multiple ${pluginType} plugin definitions for kind ${kind}`
          );
          continue;
        }
        map.set(kind, resource);
      }
    };

    for (const resource of installedPlugins) {
      addToLoadable(resource);
    }

    for (const [resource] of BUNDLED_PLUGINS) {
      addToLoadable(resource);
    }

    return loadableProps;
  }, [installedPlugins]);

  const [plugins, setPlugins] = useImmer<LoadedPluginsByTypeAndKind>(() => ({
    Variable: new Map(),
    Panel: new Map(),
    ChartQuery: new Map(),
  }));

  // Create the register callback to pass to the module's setup function
  const registerPlugin: RegisterPlugin = useCallback(
    <Kind extends string, Options extends JsonObject>(
      config: PluginRegistrationConfig<Kind, Options>
    ) => {
      switch (config.pluginType) {
        case 'Variable':
          setPlugins((draft) => {
            draft.Variable.set(config.kind, createVariablePlugin(config));
          });
          return;
        case 'Panel':
          setPlugins((draft) => {
            draft.Panel.set(config.kind, createPanelPlugin(config));
          });
          return;
        case 'ChartQuery':
          setPlugins((draft) => {
            draft.ChartQuery.set(config.kind, createChartQueryPlugin(config));
          });
          return;
        default:
          const exhaustive: never = config;
          throw new Error(`Unhandled plugin config: ${exhaustive}`);
      }
    },
    [setPlugins]
  );

  const registeredModules = useRef(new Set<PluginModule>());
  const register = useCallback(
    (pluginModule: PluginModule): void => {
      // De-dupe register calls in case multiple plugin loading boundaries
      // are waiting for the same module in parallel
      if (registeredModules.current.has(pluginModule)) {
        return;
      }

      // Call the setup function and remember it's been registered
      pluginModule.setup(registerPlugin);
      registeredModules.current.add(pluginModule);
    },
    [registerPlugin]
  );

  return { loadablePlugins, plugins, register };
}
