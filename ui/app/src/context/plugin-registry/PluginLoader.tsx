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

import loadable, { LoadableLibrary } from '@loadable/component';
import { PluginModule, PluginResource } from '@perses-ui/core';
import { BUNDLED_PLUGINS } from './bundled-plugins';

type LoadableLibraryProps = React.ComponentProps<LoadableLibrary<PluginModule>>;

interface PluginLoaderProps {
  resource: PluginResource;
}

/**
 * Uses `@loadable/component` to load a plugin library.
 */
export const PluginLoader = loadable.lib(
  (props: PluginLoaderProps) => {
    const bundled = BUNDLED_PLUGINS.get(props.resource);
    if (bundled !== undefined) {
      return bundled.importPluginModule();
    }
    throw new Error(`TODO: Support webpack module federation plugins`);
  },
  {
    cacheKey: (props) => getResourceCacheKey(props.resource),
  }
) as React.ComponentType<LoadableLibraryProps & PluginLoaderProps>;

/**
 * Gets a unique cache key for a plugin resource.
 */
export function getResourceCacheKey(resource: PluginResource) {
  return BUNDLED_PLUGINS.get(resource)?.cacheKey ?? resource.spec.plugin_module_path;
}
