// Copyright 2021 The Perses Authors
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

import { createContext, useContext, useMemo, useCallback } from 'react';
import { PluginModule, PluginResource, PluginRuntime, PluginRuntimeProvider, PluginType } from '@perses-dev/core';
import { useQuery } from 'react-query';
import { LoadedPluginsByTypeAndKind, useRegistryState } from './registry-state';

export interface PluginRegistryProps {
  children?: React.ReactNode;
  runtime: PluginRuntime;
  getInstalledPlugins: () => Promise<PluginResource[]>;
  importPluginModule: (resource: PluginResource) => Promise<PluginModule>;
}

/**
 * PluginRegistryContext provider that keeps track of all available plugins and
 * their implementations once they've been loaded.
 */
export function PluginRegistry(props: PluginRegistryProps) {
  const { children, runtime, getInstalledPlugins, importPluginModule } = props;

  const installedPlugins = useQuery('installed-plugins', getInstalledPlugins);
  const { loadablePlugins, plugins, register } = useRegistryState(installedPlugins.data);

  const loadPlugin = useCallback(
    async (pluginType: PluginType, kind: string) => {
      // Is it already loaded?
      const plugin = plugins[pluginType].get(kind);
      if (plugin !== undefined) return;

      // Is it a valid plugin we know about? (TODO: What about when plugin list is loading?)
      const resource = loadablePlugins[pluginType].get(kind);
      if (resource === undefined) {
        throw new Error(`No ${pluginType} plugin is available for kind ${kind}`);
      }

      // Load and register the resource
      const pluginModule = await importPluginModule(resource);
      register(pluginModule);
    },
    [plugins, loadablePlugins, importPluginModule, register]
  );

  const registry: PluginRegistryContextType = useMemo(() => ({ plugins, loadPlugin }), [plugins, loadPlugin]);

  // TODO: Fix this so loadPlugin takes into account list still loading
  if (installedPlugins.isLoading) return null;

  return (
    <PluginRegistryContext.Provider value={registry}>
      <PluginRuntimeProvider value={runtime}>{children}</PluginRuntimeProvider>
    </PluginRegistryContext.Provider>
  );
}

const PluginRegistryContext = createContext<PluginRegistryContextType | undefined>(undefined);

interface PluginRegistryContextType {
  plugins: LoadedPluginsByTypeAndKind;
  loadPlugin: (pluginType: PluginType, kind: string) => Promise<void>;
}

/**
 * Gets the PluginRegistryContext, throwing if the provider is missing.
 */
export function usePluginRegistry(): PluginRegistryContextType {
  const ctx = useContext(PluginRegistryContext);
  if (ctx === undefined) {
    throw new Error('No PluginRegistry context found. Did you forget a Provider?');
  }
  return ctx;
}
