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

import { JsonObject, VariableDefinition } from '@perses-dev/core';
import { usePlugin } from '../components/PluginLoadingBoundary';

/**
 * Plugin for handling custom VariableDefinitions.
 */
export interface VariablePlugin<Options extends JsonObject = JsonObject> {
  useVariableOptions: UseVariableOptionsHook<Options>;
}

/**
 * Plugin hook responsible for getting the options of a custom variable
 * definition.
 */
export type UseVariableOptionsHook<Options extends JsonObject> = (definition: VariableDefinition<Options>) => {
  data: string[];
  loading: boolean;
  error?: Error;
};

/**
 * Use the variable options from a variable plugin at runtime.
 */
export const useVariableOptions: VariablePlugin['useVariableOptions'] = (definition) => {
  const plugin = usePlugin('Variable', definition.kind);
  if (plugin === undefined) {
    // Provide default values while the plugin is being loaded
    return { data: [], loading: true };
  }
  return plugin.useVariableOptions(definition);
};
