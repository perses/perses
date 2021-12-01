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

import { Definition, JsonObject } from './definitions';
import { AnyPluginDefinition, AnyPluginImplementation } from './plugins';
import { ResourceSelector } from './resource';

export interface VariableDefinition<Options extends JsonObject> extends Definition<Options> {
  datasource?: ResourceSelector;
  display: VariableDisplayOptions;
  selection: VariableSelectionOptions;
  capturing_regexp?: string;
}

export interface VariableDisplayOptions extends JsonObject {
  hide?: boolean;
  label: string;
}

export type VariableSelectionOptions = SingleSelectOptions | MultiSelectOptions;

export type SingleSelectOptions = {
  default_value: string;
};

export type MultiSelectOptions = {
  default_value: string[];
  all_value?: string | typeof DEFAULT_ALL_VALUE;
};

export const DEFAULT_ALL_VALUE = '$__all' as const;

/**
 * Plugin for handling custom VariableDefinitions.
 */
export interface VariablePlugin<Options extends JsonObject> {
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

export type AnyVariableDefinition = AnyPluginDefinition<'Variable'>;

export type AnyVariablePlugin = AnyPluginImplementation<'Variable'>;
