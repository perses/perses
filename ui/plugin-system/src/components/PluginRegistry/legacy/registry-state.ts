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

import { useCallback, useMemo, useRef } from 'react';
import { useImmer } from 'use-immer';
import {
  Plugin,
  PluginModuleResource,
  PluginType,
  ALL_PLUGIN_TYPES,
  PluginImplementation,
  VariablePlugin,
  PanelPlugin,
  GraphQueryPlugin,
} from '../../../model';

// Given a PluginType and Kind, return the associated Plugin that can be loaded
export type PluginResourcesByTypeAndKind = {
  [K in PluginType]: Record<string, PluginModuleResource>;
};

// Once a plugin is registered, it's stored by plugin type and kind
export type LoadedPluginsByTypeAndKind = {
  [Type in PluginType]: Record<string, PluginImplementation<Type, unknown>>;
};

/**
 * Hook for setting up plugin registry state. Returns the state, plus a function
 * for registering plugins with that state.
 */
export function useRegistryState(installedPlugins?: PluginModuleResource[]) {
  // Go through all installed plugins and bundled plugins and build an index of
  // those resources by type and kind
  const loadablePlugins = useMemo(() => {
    const loadableProps = {} as PluginResourcesByTypeAndKind;
    for (const pluginType of ALL_PLUGIN_TYPES) {
      loadableProps[pluginType] = {};
    }

    // If no plugins installed or waiting on that data, nothing else to do
    if (installedPlugins === undefined) return loadableProps;

    for (const resource of installedPlugins) {
      for (const plugin of resource.spec.plugins) {
        const { pluginType, kind } = plugin;

        const map = loadableProps[pluginType];
        if (map[kind] !== undefined) {
          console.warn(`Got multiple ${pluginType} plugin definitions for kind ${kind}`);
          continue;
        }
        map[kind] = resource;
      }
    }

    return loadableProps;
  }, [installedPlugins]);

  const [plugins, setPlugins] = useImmer<LoadedPluginsByTypeAndKind>(() => {
    const loadedPlugins = {} as LoadedPluginsByTypeAndKind;
    for (const pluginType of ALL_PLUGIN_TYPES) {
      loadedPlugins[pluginType] = {};
    }
    return loadedPlugins;
  });

  const registeredModules = useRef(new Set<unknown>());
  const register = useCallback(
    (resource: PluginModuleResource, pluginModule: unknown): void => {
      // De-dupe register calls in case multiple plugin loading boundaries
      // are waiting for the same module in parallel
      if (registeredModules.current.has(pluginModule)) {
        return;
      }

      // Treat plugin module as JS module with named exports that are each a Plugin
      const plugins = pluginModule as Record<string, Plugin<unknown>>;

      setPlugins((draft) => {
        // Look for all the plugins specified in the metadata
        for (const pluginMetadata of resource.spec.plugins) {
          // Assume that plugins will be exported under the same named export as the kind they handle
          // TODO: Do we need to allow for different named exports and an option in the metadata to tell us the name?
          const { pluginType, kind } = pluginMetadata;
          const plugin = plugins[kind];
          if (plugin === undefined) {
            // TODO: How to handle missing plugins?
            console.warn(`Could not find ${pluginType} plugin for kind '${kind}' in ${resource.metadata.name}`);
            continue;
          }

          // Add to registry state
          switch (pluginType) {
            case 'Variable':
              draft.Variable[kind] = plugin as unknown as VariablePlugin;
              break;
            case 'Panel':
              draft.Panel[kind] = plugin as unknown as PanelPlugin;
              break;
            case 'GraphQuery':
              draft.GraphQuery[kind] = plugin as unknown as GraphQueryPlugin;
              break;
            default:
              const exhaustive: never = pluginType;
              throw new Error(`Unhandled plugin config: ${exhaustive}`);
          }
        }
      });

      // Remember this module has been registered
      registeredModules.current.add(pluginModule);
    },
    [setPlugins]
  );

  return { loadablePlugins, plugins, register };
}
