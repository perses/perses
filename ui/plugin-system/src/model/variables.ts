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

import { JsonObject, ListVariableDefinition, VariableOption } from '@perses-dev/core';
import { usePlugin } from '../components/PluginLoadingBoundary';

/**
 * Plugin for handling custom VariableDefinitions.
 */
export interface VariablePlugin<Options extends JsonObject = JsonObject> {
  getVariableOptions: GetVariableOptions<Options>;
}

/**
 * Plugin hook responsible for getting the options of a custom variable
 * definition.
 */
export type GetVariableOptions<Options extends JsonObject = JsonObject> = (
  definition: ListVariableDefinition<Options>
) => Promise<{ data: VariableOption[] }>;

/**
 * Use the variable options from a variable plugin at runtime.
 */
export const useVariablePlugin = (definition: ListVariableDefinition) => {
  const plugin = usePlugin('Variable', definition.options.optionsLoader.kind);
  if (plugin === undefined) {
    // Provide default values while the plugin is being loaded
    return;
  }

  return {
    getVariableOptions: () => {
      return plugin.getVariableOptions(definition);
    },
  };
};
