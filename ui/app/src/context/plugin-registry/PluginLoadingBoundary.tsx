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

import {
  Fragment,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from 'react';
import { useImmer } from 'use-immer';
import { useErrorHandler } from 'react-error-boundary';
import { PluginModule, PluginType, PluginResource } from '@perses-ui/core';
import { getResourceCacheKey, PluginLoader } from './PluginLoader';
import { usePluginRegistry } from './PluginRegistry';

export interface PluginLoadingBoundaryContextType {
  registerPluginDependency: (pluginType: PluginType, kind: string) => void;
}

export const PluginLoadingBoundaryContext = createContext<
  PluginLoadingBoundaryContextType | undefined
>(undefined);

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

  const { loadablePlugins, register, plugins } = usePluginRegistry();

  // Keep a Map of PluginResource that our children have registered as
  // dependencies -> whether it's currently loading
  const [boundaryState, setBoundaryState] = useImmer<
    Map<PluginResource, boolean>
  >(() => new Map());

  const throwError = useErrorHandler();

  // When children are rendered, they can register a dependency here to tell us
  // what plugins they need so we can load them if necessary
  const registerPluginDependency = useCallback(
    (pluginType: PluginType, kind: string) => {
      // Is this a plugin we know about?
      const resource = loadablePlugins[pluginType].get(kind);
      if (resource === undefined) {
        return throwError(
          new Error(`No ${pluginType} plugin is available for kind ${kind}`)
        );
      }

      // Is it already loaded?
      const isLoading = plugins[pluginType].get(kind) === undefined;

      setBoundaryState((draft) => {
        if (draft.has(resource)) return;
        draft.set(resource, isLoading);
      });
    },
    [loadablePlugins, throwError, setBoundaryState, plugins]
  );

  // Once a PluginModule has loaded, register it with the PluginRegistry and
  // update our dependency state so we know it's finished loading
  const pluginLoadedCallback = useCallback(
    (resource: PluginResource, pluginModule: PluginModule | null) => {
      if (pluginModule === null) return;
      register(pluginModule);
      setBoundaryState((draft) => {
        draft.set(resource, false);
      });
    },
    [register, setBoundaryState]
  );

  const context = useMemo(
    () => ({ registerPluginDependency }),
    [registerPluginDependency]
  );

  // Use the dependency Map to build up a list of plugins that need to load,
  // whether or not we've finished loading all dependencies for our children,
  // and a unique key representing all dependencies
  const { loadableComponents, isLoaded, fragmentKey } = useMemo(() => {
    let isLoaded = true;
    let fragmentKey = '';
    const loadableComponents: React.ReactNode[] = [];
    for (const [resource, isLoading] of boundaryState.entries()) {
      // If any plugins are still loading, we're not finished yet
      if (isLoading) isLoaded = false;

      // Use the unique cache key of each dependency to build an overall key
      // representing the dependencies
      const cacheKey = getResourceCacheKey(resource);
      fragmentKey += cacheKey;

      // Use the PluginLoader component to actually load the plugin
      loadableComponents.push(
        <PluginLoader
          key={cacheKey}
          ref={(pluginModule) => pluginLoadedCallback(resource, pluginModule)}
          resource={resource}
        />
      );
    }

    return { loadableComponents, isLoaded, fragmentKey };
  }, [boundaryState, pluginLoadedCallback]);

  return (
    <PluginLoadingBoundaryContext.Provider value={context}>
      {loadableComponents}
      {/* Wrap in a fragment with a key that will cause children to be unmounted 
          if dependencies change (since plugins could contain hooks and in React
          we can't conditionally call hooks) */}
      {isLoaded && <Fragment key={fragmentKey}>{children}</Fragment>}
      {isLoaded === false && fallback}
    </PluginLoadingBoundaryContext.Provider>
  );
}

/**
 * Gets the PluginLoadingBoundary context and throws if the Provider is missing.
 */
export function usePluginLoadingBoundary() {
  const ctx = useContext(PluginLoadingBoundaryContext);
  if (ctx === undefined) {
    throw new Error(
      `PluginLoadingBoundary context not found. Did you forget a Provider?`
    );
  }
  return ctx;
}
