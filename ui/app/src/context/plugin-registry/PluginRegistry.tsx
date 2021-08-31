import { createContext, useContext, useMemo, useRef } from 'react';
import { PluginModule, PluginRuntimeProvider } from '@perses-ui/core';
import { pluginRuntime } from '../../model/plugin-runtime';
import { PluginBoundary, PluginBoundaryProps } from './PluginBoundary';
import {
  LoadedPluginsByTypeAndKind,
  PluginResourcesByTypeAndKind,
  useRegistryState,
} from './registry-state';

export const PluginRegistryContext = createContext<
  PluginRegistryContextType | undefined
>(undefined);

export interface PluginRegistryContextType {
  loadablePlugins: PluginResourcesByTypeAndKind;
  plugins: LoadedPluginsByTypeAndKind;
  register: (pluginModule: PluginModule) => void;
}

export type PluginRegistryProviderProps = PluginBoundaryProps;

/**
 * PluginRegistryContext provider that keeps track of all available plugins and
 * their implementations once they've been loaded.
 */
export function PluginRegistry(props: PluginRegistryProviderProps) {
  const { children, ...others } = props;

  // TODO: Fetch from server
  const installedPlugins = useRef([]);

  const { loadablePlugins, plugins, register } = useRegistryState(
    installedPlugins.current
  );

  const registry = useMemo(
    () => ({ loadablePlugins, plugins, register }),
    [loadablePlugins, plugins, register]
  );

  return (
    <PluginRegistryContext.Provider value={registry}>
      <PluginRuntimeProvider value={pluginRuntime}>
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
    throw new Error(
      'No PluginRegistry context found. Did you forget a Provider?'
    );
  }
  return ctx;
}
