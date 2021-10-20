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

import { PluginModule, PluginResource } from '@perses-ui/core';

// Eagerly load the metadata for the bundled plugins, but lazy-load the plugins
import prometheusPackage from '@perses-ui/prometheus-plugin/package.json';
import panelsPackage from '@perses-ui/panels-plugin/package.json';

export interface BundledPlugin {
  cacheKey: string;
  importPluginModule: () => Promise<PluginModule>;
}

/**
 * Plugins that are bundled with the app via code-splitting.
 */
export const BUNDLED_PLUGINS = new Map<PluginResource, BundledPlugin>();
BUNDLED_PLUGINS.set(prometheusPackage.perses as PluginResource, {
  cacheKey: 'prometheus-plugin',
  importPluginModule: () => import('@perses-ui/prometheus-plugin'),
});
BUNDLED_PLUGINS.set(panelsPackage.perses as PluginResource, {
  cacheKey: 'panels-plugin',
  importPluginModule: () => import('@perses-ui/panels-plugin'),
});
