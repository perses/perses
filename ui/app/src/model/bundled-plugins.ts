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
import prometheusResource from '@perses-dev/prometheus-plugin/plugin.json';
import panelsResource from '@perses-dev/panels-plugin/plugin.json';
import { PluginLoader, PluginModuleResource, dynamicImportPluginLoader } from '@perses-dev/plugin-system';

/**
 * A PluginLoader that includes all the "built-in" plugins that are bundled with Perses by default.
 */
export const bundledPluginLoader: PluginLoader = dynamicImportPluginLoader([
  {
    resource: prometheusResource as PluginModuleResource,
    importPlugin: () => import('@perses-dev/prometheus-plugin'),
  },
  {
    resource: panelsResource as PluginModuleResource,
    importPlugin: () => import('@perses-dev/panels-plugin'),
  },
]);
