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

import { ListVariableDefinition } from '@perses-dev/core';
import { usePlugin } from '../components/PluginLoadingBoundary';

export type VariableOption = { label: string; value: string };

/**
 * Plugin for handling custom VariableDefinitions.
 */
export interface VariablePlugin<Spec = unknown> {
  useVariableOptions: UseVariableOptionsHook<Spec>;
}

/**
 * Plugin hook responsible for getting the options of a custom variable
 * definition.
 */
export type UseVariableOptionsHook<Spec> = (definition: ListVariableDefinition<Spec>) => {
  data: VariableOption[];
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
