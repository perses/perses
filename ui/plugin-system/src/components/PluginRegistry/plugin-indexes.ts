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

import { useEvent } from '@perses-dev/core';
import { useCallback, useRef } from 'react';
import { PluginMetadata, PluginModuleResource, PluginType } from '../../model';
import { getTypeAndKindKey } from '../../utils/cache-keys';

export type GetInstalledPlugins = () => Promise<PluginModuleResource[]>;

export interface PluginIndexes {
  // Plugin resources by plugin type and kind (i.e. look up what module a plugin type and kind is in)
  pluginResourcesByTypeAndKind: Map<string, PluginModuleResource>;
  // Plugin metadata by plugin type
  pluginMetadataByType: Map<string, PluginMetadata[]>;
}

/**
 * Returns an async callback for getting indexes of the installed plugin data.
 */
export function usePluginIndexes(getInstalledPlugins: GetInstalledPlugins) {
  // Creates indexes from the installed plugins data (does useEvent because this accesses the getInstalledPlugins prop
  // and we want a stable reference for the callback below)
  const createPluginIndexes = useEvent(async (): Promise<PluginIndexes> => {
    const installedPlugins = await getInstalledPlugins();

    // Create the two indexes from the installed plugins
    const pluginResourcesByTypeAndKind = new Map<string, PluginModuleResource>();
    const pluginMetadataByType = new Map<string, PluginMetadata[]>();

    for (const resource of installedPlugins) {
      for (const pluginMetadata of resource.spec.plugins) {
        const { pluginType, kind } = pluginMetadata;

        // Index the plugin by type and kind to point at the module that contains it
        const key = getTypeAndKindKey(pluginType, kind);
        if (pluginResourcesByTypeAndKind.has(key)) {
          console.warn(`Got more than one ${pluginType} plugin for kind ${kind}`);
        }
        pluginResourcesByTypeAndKind.set(key, resource);

        // Index the metadata by plugin type
        let list = pluginMetadataByType.get(pluginType);
        if (list === undefined) {
          list = [];
          pluginMetadataByType.set(pluginType, list);
        }
        list.push(pluginMetadata);
      }
    }

    return {
      pluginResourcesByTypeAndKind,
      pluginMetadataByType,
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
