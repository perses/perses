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

import { UnknownSpec, useEvent } from '@perses-dev/core';
import { useRef, useCallback, useMemo } from 'react';
import { PluginModuleResource, PluginType, PluginImplementation, Plugin, PluginLoader } from '../../model';
import { PluginRegistryContext } from '../../runtime';
import { usePluginIndexes, getTypeAndKindKey } from './plugin-indexes';

export interface PluginRegistryProps {
  children?: React.ReactNode;
  pluginLoader: PluginLoader;
}

/**
 * PluginRegistryContext provider that keeps track of all available plugins and provides an API for getting them or
 * querying the metadata about them.
 */
export function PluginRegistry(props: PluginRegistryProps) {
  const {
    pluginLoader: { getInstalledPlugins, importPluginModule },
    children,
  } = props;

  const getPluginIndexes = usePluginIndexes(getInstalledPlugins);

  // De-dupe calls to import plugin modules
  const importCache = useRef(new Map<PluginModuleResource, Promise<unknown>>());

  // Do useEvent here since this accesses the importPluginModule prop and we want a stable reference to it for the
  // callback below
  const loadPluginModule = useEvent((resource: PluginModuleResource) => {
    let request = importCache.current.get(resource);
    if (request === undefined) {
      request = importPluginModule(resource);
      importCache.current.set(resource, request);

      // Remove failed requests from the cache so they can potentially be retried
      request.catch(() => importCache.current.delete(resource));
    }
    return request;
  });

  const getPlugin = useCallback(
    async <T extends PluginType>(pluginType: T, kind: string): Promise<PluginImplementation<T>> => {
      // Get the indexes of the installed plugins
      const pluginIndexes = await getPluginIndexes();

      // Figure out what module the plugin is in by looking in the index
      const typeAndKindKey = getTypeAndKindKey(pluginType, kind);
      const resource = pluginIndexes.pluginResourcesByTypeAndKind.get(typeAndKindKey);
      if (resource === undefined) {
        throw new Error(`A ${pluginType} plugin for kind '${kind}' is not installed`);
      }

      // Treat the plugin module as a bunch of named exports that have plugins
      const pluginModule = (await loadPluginModule(resource)) as Record<string, Plugin<UnknownSpec>>;

      // We currently assume that plugin modules will have named exports that match the kinds they handle
      const plugin = pluginModule[kind];
      if (plugin === undefined) {
        throw new Error(
          `The ${pluginType} plugin for kind '${kind}' is missing from the ${resource.metadata.name} plugin module`
        );
      }

      return plugin as PluginImplementation<T>;
    },
    [getPluginIndexes, loadPluginModule]
  );

  const listPluginMetadata = useCallback(
    async (pluginType: PluginType) => {
      const pluginIndexes = await getPluginIndexes();
      return pluginIndexes.pluginMetadataByType.get(pluginType) ?? [];
    },
    [getPluginIndexes]
  );

  // Create the registry's context value and render
  const context = useMemo(() => ({ getPlugin, listPluginMetadata }), [getPlugin, listPluginMetadata]);
  return <PluginRegistryContext.Provider value={context}>{children}</PluginRegistryContext.Provider>;
}
