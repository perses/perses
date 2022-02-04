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

import { JsonObject } from '@perses-dev/core';
import { Fragment, createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useImmer } from 'use-immer';
import { PluginType, ALL_PLUGIN_TYPES, PluginDefinition, PluginImplementation } from '../../model';
import { usePluginRegistry } from '../PluginRegistry';
import { PluginLoader } from './PluginLoader';

// Plugin dependencies by PluginType and a Set of the kinds
type PluginDependencies = {
  [K in PluginType]: Set<string>;
};

export interface PluginLoadingBoundaryProps {
  fallback: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Plugin dependencies are registered here by children. This takes care of loading
 * those dependencies on demand and acts similar to React's Suspense in that it
 * will show a loading fallback while those plugins are being loaded.
 */
export function PluginLoadingBoundary(props: PluginLoadingBoundaryProps) {
  const { fallback, children } = props;

  const { plugins } = usePluginRegistry();

  // Keep track of all plugin dependencies registered by child components
  const [dependencies, setDependencies] = useImmer<PluginDependencies>(() => {
    const deps = {} as PluginDependencies;
    for (const pluginType of ALL_PLUGIN_TYPES) {
      deps[pluginType] = new Set();
    }
    return deps;
  });

  // When children are rendered, they can register a dependency here to tell us
  // what plugins they need so we can load them if necessary
  const registerPluginDependency = useCallback(
    (pluginType: PluginType, kind: string) => {
      setDependencies((draft) => {
        draft[pluginType].add(kind);
      });
    },
    [setDependencies]
  );

  const context = useMemo(() => ({ registerPluginDependency }), [registerPluginDependency]);

  const { loaders, fragmentKey } = useMemo(() => {
    let fragmentKey = '';
    const loaders: React.ReactNode[] = [];
    for (const pluginType of ALL_PLUGIN_TYPES) {
      // Build an overall key for the dependencies by combining pluginType and
      // kind of all dependencies
      fragmentKey += `_${pluginType}:`;

      const kinds = dependencies[pluginType];
      for (const kind of kinds.values()) {
        fragmentKey += kind;

        // Is this plugin already loaded?
        const plugin = plugins[pluginType].get(kind);
        if (plugin !== undefined) continue;

        // Nope, add it to the loaders list
        loaders.push(<PluginLoader key={`${pluginType}:${kind}`} pluginType={pluginType} kind={kind} />);
      }
    }

    return { loaders, fragmentKey };
  }, [plugins, dependencies]);

  // All dependencies are loaded once we don't have any loaders to render
  const isLoaded = loaders.length === 0;

  return (
    <PluginLoadingBoundaryContext.Provider value={context}>
      {loaders}
      {/* Wrap in a fragment with a key that will cause children to be unmounted 
          if dependencies change (since plugins could contain hooks and in React
          we can't conditionally call hooks) */}
      {isLoaded && <Fragment key={fragmentKey}>{children}</Fragment>}
      {isLoaded === false && fallback}
    </PluginLoadingBoundaryContext.Provider>
  );
}

interface PluginLoadingBoundaryContextType {
  registerPluginDependency: (pluginType: PluginType, kind: string) => void;
}

const PluginLoadingBoundaryContext = createContext<PluginLoadingBoundaryContextType | undefined>(undefined);

/**
 * Gets the PluginLoadingBoundary context and throws if the Provider is missing.
 */
export function usePluginLoadingBoundary() {
  const ctx = useContext(PluginLoadingBoundaryContext);
  if (ctx === undefined) {
    throw new Error(`PluginLoadingBoundary context not found. Did you forget a Provider?`);
  }
  return ctx;
}

/**
 * Generic usePlugin that will register the dependency with the nearest LoadingBoundary and get the plugin if it's
 * already loaded
 */
export function usePlugin<Type extends PluginType>(
  pluginType: Type,
  definition: PluginDefinition<Type, JsonObject>
): PluginImplementation<Type, JsonObject> | undefined {
  // Tell the loading boundary about the dependency
  const { registerPluginDependency } = usePluginLoadingBoundary();
  useEffect(() => {
    registerPluginDependency(pluginType, definition.kind);
  }, [pluginType, definition.kind, registerPluginDependency]);

  // Get the plugin, which could be undefined if it hasn't loaded yet
  const { plugins } = usePluginRegistry();
  return plugins[pluginType].get(definition.kind);
}
