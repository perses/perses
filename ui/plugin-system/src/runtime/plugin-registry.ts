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

import { BuiltinVariableDefinition } from '@perses-dev/core';
import { useQueries, useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import { DefaultPluginKinds, PluginImplementation, PluginMetadataWithModule, PluginType } from '../model';

export interface PluginRegistryContextType {
  getPlugin<T extends PluginType>(kind: T, name: string): Promise<PluginImplementation<T>>;
  listPluginMetadata(pluginTypes: string[]): Promise<PluginMetadataWithModule[]>;
  defaultPluginKinds?: DefaultPluginKinds;
}

export const PluginRegistryContext = createContext<PluginRegistryContextType | undefined>(undefined);

/**
 * Use the PluginRegistry context directly. This is meant as an escape hatch for custom async flows. You should probably
 * be using `usePlugin` or `useListPluginMetadata` instead.
 */
export function usePluginRegistry(): PluginRegistryContextType {
  const ctx = useContext(PluginRegistryContext);
  if (ctx === undefined) {
    throw new Error('PluginRegistryContext not found. Did you forget a provider?');
  }
  return ctx;
}

// Allows consumers to pass useQuery options from react-query when loading a plugin
type UsePluginOptions<T extends PluginType> = Omit<
  UseQueryOptions<PluginImplementation<T>, Error, PluginImplementation<T>, [string, PluginType | undefined, string]>,
  'queryKey' | 'queryFn'
>;

/**
 * Loads a plugin and returns the plugin implementation, along with loading/error state.
 */
export function usePlugin<T extends PluginType>(
  pluginType: T | undefined,
  kind: string,
  options?: UsePluginOptions<T>
): UseQueryResult<PluginImplementation<T>, Error> {
  // We never want to ask for a plugin when the kind isn't set yet, so disable those queries automatically
  options = {
    ...options,
    enabled: (options?.enabled ?? true) && pluginType !== undefined && kind !== '',
  };
  const { getPlugin } = usePluginRegistry();
  return useQuery({
    queryKey: ['getPlugin', pluginType, kind],
    queryFn: () => getPlugin(pluginType!, kind),
    ...options,
  });
}

/**
 * Loads a list of plugins and returns the plugin implementation, along with loading/error state.
 */
export function usePlugins<T extends PluginType>(
  pluginType: T,
  plugins: Array<{ kind: string }>
): Array<UseQueryResult<PluginImplementation<T>>> {
  const { getPlugin } = usePluginRegistry();

  // useQueries() does not support queries with duplicate keys, therefore we de-duplicate the plugin kinds before running useQueries()
  // This resolves the following warning in the JS console: "[QueriesObserver]: Duplicate Queries found. This might result in unexpected behavior."
  // https://github.com/TanStack/query/issues/8224#issuecomment-2523554831
  // https://github.com/TanStack/query/issues/4187#issuecomment-1256336901
  const kinds = [...new Set(plugins.map((p) => p.kind))];

  const result: Array<UseQueryResult<PluginImplementation<T>>> = useQueries({
    queries: kinds.map((kind) => {
      return {
        queryKey: ['getPlugin', pluginType, kind],
        queryFn: () => getPlugin(pluginType, kind),
      };
    }),
  });

  // Re-assemble array in original order
  return plugins.map((p) => result[kinds.indexOf(p.kind)]!);
}

// Allow consumers to pass useQuery options from react-query when listing metadata
type UseListPluginMetadataOptions = Omit<
  UseQueryOptions<PluginMetadataWithModule[], Error, PluginMetadataWithModule[], [string, string[]]>,
  'queryKey' | 'queryFn'
>;

/**
 * Gets a list of plugin metadata for the specified plugin type and returns it, along with loading/error state.
 */
export function useListPluginMetadata(
  pluginTypes: string[],
  options?: UseListPluginMetadataOptions
): UseQueryResult<PluginMetadataWithModule[]> {
  const { listPluginMetadata } = usePluginRegistry();
  return useQuery({
    queryKey: ['listPluginMetadata', pluginTypes],
    queryFn: () => listPluginMetadata(pluginTypes),
    ...options,
  });
}

export function usePluginBuiltinVariableDefinitions(): UseQueryResult<BuiltinVariableDefinition[]> {
  const { getPlugin, listPluginMetadata } = usePluginRegistry();

  return useQuery({
    queryKey: ['usePluginBuiltinVariableDefinitions'],
    queryFn: async () => {
      const datasources = await listPluginMetadata(['Datasource']);
      const datasourceNames = new Set(datasources.map((datasource) => datasource.spec.name));
      const result: BuiltinVariableDefinition[] = [];
      for (const name of datasourceNames) {
        const plugin = await getPlugin('Datasource', name);
        if (plugin.getBuiltinVariableDefinitions) {
          plugin.getBuiltinVariableDefinitions().forEach((definition) => result.push(definition));
        }
      }
      return result;
    },
  });
}
