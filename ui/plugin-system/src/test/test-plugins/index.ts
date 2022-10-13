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

import { PluginModuleResource } from '../../model';
import { PluginRegistryProps } from '../../components/PluginRegistry/PluginRegistry';
import bertResource from './bert/plugin.json';
import ernieResource from './ernie/plugin.json';

// Put all the test plugins into a Map
const testPlugins = new Map<PluginModuleResource, () => Promise<unknown>>();
testPlugins.set(bertResource as PluginModuleResource, () => import('./bert'));
testPlugins.set(ernieResource as PluginModuleResource, () => import('./ernie'));

/**
 * Some props for testing the PluginRegistry that use the test plugins/metadata in this folder.
 */
export const testRegistryProps: Omit<PluginRegistryProps, 'children'> = {
  getInstalledPlugins: () => {
    const resources = Array.from(testPlugins.keys());
    return Promise.resolve(resources);
  },
  importPluginModule: (resource) => {
    const importFn = testPlugins.get(resource);
    if (importFn === undefined) {
      throw new Error('Plugin not found');
    }
    return importFn();
  },
};
