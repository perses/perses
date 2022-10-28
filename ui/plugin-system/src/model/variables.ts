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

import { UnknownSpec, AbsoluteTimeRange } from '@perses-dev/core';
import { VariableStateMap, DatasourceStore } from '../runtime';
import { Plugin } from './plugin-base';

export type VariableOption = { label: string; value: string };

export interface GetVariableOptionsContext {
  variables: VariableStateMap;
  datasourceStore: DatasourceStore;
  timeRange: AbsoluteTimeRange;
}

/**
 * Plugin for handling custom VariableDefinitions.
 */
export interface VariablePlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getVariableOptions: GetVariableOptions<Spec>;

  /**
   * Returns a list of variables name this variable depends on. Used to optimize fetching
   */
  dependsOn?: (definition: Spec) => string[];
}

/**
 * Plugin hook responsible for getting the options of a custom variable
 * definition.
 */
export type GetVariableOptions<Spec> = (
  definition: Spec,
  ctx: GetVariableOptionsContext
) => Promise<{ data: VariableOption[] }>;
