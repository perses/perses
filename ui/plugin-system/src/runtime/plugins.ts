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

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { usePluginRegistry } from '../components/PluginRegistry';
import { PluginImplementation, PluginMetadata, PluginType } from '../model';

// Allows consumers to pass useQuery options from react-query when loading a plugin
type UsePluginOptions<T extends PluginType> = Omit<
  UseQueryOptions<PluginImplementation<T>, Error, PluginImplementation<T>, [string, PluginType, string]>,
  'queryKey' | 'queryFn'
>;

/**
 * Loads a plugin and returns the plugin implementation, along with loading/error state.
 */
export function usePlugin<T extends PluginType>(pluginType: T, kind: string, options?: UsePluginOptions<T>) {
  // We never want to ask for a plugin when the kind isn't set yet, so disable those queries automatically
  options = {
    ...options,
    enabled: (options?.enabled ?? true) && kind !== '',
  };
  const { getPlugin } = usePluginRegistry();
  return useQuery(['getPlugin', pluginType, kind], () => getPlugin(pluginType, kind), options);
}

// Allow consumers to pass useQuery options from react-query when listing metadata
type UseListPluginMetadataOptions = Omit<
  UseQueryOptions<PluginMetadata[], Error, PluginMetadata[], [string, PluginType]>,
  'queryKey' | 'queryFn'
>;

/**
 * Gets a list of plugin metadata for the specified plugin type and returns it, along with loading/error state.
 */
export function useListPluginMetadata(pluginType: PluginType, options?: UseListPluginMetadataOptions) {
  const { listPluginMetadata } = usePluginRegistry();
  return useQuery(['listPluginMetadata', pluginType], () => listPluginMetadata(pluginType), options);
}
