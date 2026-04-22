// Copyright 2023 The Perses Authors
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

import { Query, QueryKey } from '@tanstack/react-query';
import { UnknownSpec, TraceData, AbsoluteTimeRange } from '@perses-dev/core';
import { DatasourceStore, VariableStateMap } from '../runtime';
import { Plugin } from './plugin-base';

/**
 * An object containing all the dependencies of a TraceQuery.
 */
type TraceQueryQueryPluginDependencies = {
  /**
   * Returns a list of variables name this trace query depends on.
   */
  variables?: string[];
};

/**
 * A plugin for running trace queries.
 */
export interface TraceQueryPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getTraceData: (spec: Spec, ctx: TraceQueryContext) => Promise<TraceData>;
  dependsOn?: (spec: Spec, ctx: TraceQueryContext) => TraceQueryQueryPluginDependencies;
}

/**
 * Context available to TraceQuery plugins at runtime.
 */
export interface TraceQueryContext {
  datasourceStore: DatasourceStore;
  absoluteTimeRange?: AbsoluteTimeRange;
  variableState: VariableStateMap;
}

export type TraceDataQuery = Query<TraceData, unknown, TraceData, QueryKey>;
