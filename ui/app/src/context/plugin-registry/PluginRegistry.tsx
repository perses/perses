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

import { createContext, useContext, useMemo, useRef } from 'react';
import { PluginModule, PluginRuntime, PluginRuntimeProvider } from '@perses-dev/core';
import { PluginBoundary, PluginBoundaryProps } from './PluginBoundary';
import { LoadedPluginsByTypeAndKind, PluginResourcesByTypeAndKind, useRegistryState } from './registry-state';

export const PluginRegistryContext = createContext<PluginRegistryContextType | undefined>(undefined);

export interface PluginRegistryContextType {
  loadablePlugins: PluginResourcesByTypeAndKind;
  plugins: LoadedPluginsByTypeAndKind;
  register: (pluginModule: PluginModule) => void;
}

export interface PluginRegistryProviderProps extends PluginBoundaryProps {
  runtime: PluginRuntime;
}

/**
 * PluginRegistryContext provider that keeps track of all available plugins and
 * their implementations once they've been loaded.
 */
export function PluginRegistry(props: PluginRegistryProviderProps) {
  const { children, runtime, ...others } = props;

  // TODO: Fetch from server
  const installedPlugins = useRef([]);

  const { loadablePlugins, plugins, register } = useRegistryState(installedPlugins.current);

  const registry = useMemo(() => ({ loadablePlugins, plugins, register }), [loadablePlugins, plugins, register]);

  return (
    <PluginRegistryContext.Provider value={registry}>
      <PluginRuntimeProvider value={runtime}>
        <PluginBoundary {...others}>{children}</PluginBoundary>
      </PluginRuntimeProvider>
    </PluginRegistryContext.Provider>
  );
}

/**
 * Gets the PluginRegistryContext, throwing if the provider is missing.
 */
export function usePluginRegistry() {
  const ctx = useContext(PluginRegistryContext);
  if (ctx === undefined) {
    throw new Error('No PluginRegistry context found. Did you forget a Provider?');
  }
  return ctx;
}
