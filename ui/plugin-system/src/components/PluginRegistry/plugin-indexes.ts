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

import { useEvent } from '@perses-dev/core';
import { useCallback, useRef } from 'react';
import { PluginLoader, PluginMetadataWithModule, PluginModuleResource, PluginType } from '../../model';

export interface PluginIndexes {
  // Plugin resources by plugin type and kind (i.e. look up what module a plugin type and kind is in)
  pluginResourcesByNameAndKind: Map<string, PluginModuleResource>;
  // Plugin metadata by plugin type
  pluginMetadataByKind: Map<string, PluginMetadataWithModule[]>;
}

/**
 * Returns an async callback for getting indexes of the installed plugin data.
 */
export function usePluginIndexes(
  getInstalledPlugins: PluginLoader['getInstalledPlugins']
): () => Promise<PluginIndexes> {
  // Creates indexes from the installed plugins data (does useEvent because this accesses the getInstalledPlugins prop
  // and we want a stable reference for the callback below)
  const createPluginIndexes = useEvent(async (): Promise<PluginIndexes> => {
    const installedPlugins = await getInstalledPlugins();

    // Create the two indexes from the installed plugins
    const pluginResourcesByNameAndKind = new Map<string, PluginModuleResource>();
    const pluginMetadataByKind = new Map<string, PluginMetadataWithModule[]>();

    for (const resource of installedPlugins) {
      for (const pluginMetadata of resource.spec.plugins) {
        const {
          kind,
          spec: { name },
        } = pluginMetadata;

        // Index the plugin by type and kind to point at the module that contains it
        const key = getTypeAndKindKey(kind, name);
        if (pluginResourcesByNameAndKind.has(key)) {
          console.warn(`Got more than one ${kind} plugin for kind ${name}`);
        }
        pluginResourcesByNameAndKind.set(key, resource);

        // Index the metadata by plugin type
        let list = pluginMetadataByKind.get(kind);
        if (list === undefined) {
          list = [];
          pluginMetadataByKind.set(kind, list);
        }
        list.push({ ...pluginMetadata, module: resource.metadata });
      }
    }

    return {
      pluginResourcesByNameAndKind,
      pluginMetadataByKind,
    };
  });

  // De-dupe creating plugin indexes (i.e. requests to get installed plugins)
  const pluginIndexesCache = useRef<Promise<PluginIndexes> | undefined>(undefined);
  const getPluginIndexes = useCallback(() => {
    let request = pluginIndexesCache.current;
    if (request === undefined) {
      request = createPluginIndexes();
      pluginIndexesCache.current = request;

      // Remove failed requests from the cache so they can potentially be retried
      request.catch(() => pluginIndexesCache.current === undefined);
    }
    return request;
  }, [createPluginIndexes]);

  return getPluginIndexes;
}

/**
 * Gets a unique key for a plugin type/kind that can be used as a cache key.
 */
export function getTypeAndKindKey(kind: PluginType, name: string): string {
  return `${kind}:${name}`;
}
