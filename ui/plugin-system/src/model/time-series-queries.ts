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
import { AbsoluteTimeRange, UnknownSpec, TimeSeriesData } from '@perses-dev/core';
import { DatasourceStore, VariableStateMap } from '../runtime';
import { Plugin } from './plugin-base';

/**
 * An object containing all the dependencies of a TimeSeriesQuery.
 */
export type TimeSeriesQueryPluginDependencies = {
  /**
   * Returns a list of variables name this time series query depends on.
   */
  variables?: string[];
  /**
   * Returns a list of query indices (0-based) this time series query depends on.
   * Used by plugins that need to reference results from other queries.
   */
  queries?: number[]; // LOGZ.IO CHANGE:: APPZ-955-math-on-queries-formulas
};

/**
 * A plugin for running time series queries.
 */
export interface TimeSeriesQueryPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getTimeSeriesData: (spec: Spec, ctx: TimeSeriesQueryContext, abortSignal?: AbortSignal) => Promise<TimeSeriesData>;

  dependsOn?: (spec: Spec, ctx: TimeSeriesQueryContext) => TimeSeriesQueryPluginDependencies;
}

export type TimeSeriesQueryMode = 'instant' | 'range';

/**
 * Context available to TimeSeriesQuery plugins at runtime.
 */
export interface TimeSeriesQueryContext {
  suggestedStepMs?: number;
  mode?: TimeSeriesQueryMode;
  timeRange: AbsoluteTimeRange;
  variableState: VariableStateMap;
  datasourceStore: DatasourceStore;
  // LOGZ.IO CHANGE START:: APPZ-955-math-on-queries-formulas
  /**
   * Results from other queries that this query may depend on.
   * Map key is the query index (0-based), value is the resolved time series data.
   * Only populated for queries that declare dependencies via dependsOn.queries.
   */
  resolvedQueryResults?: Map<number, TimeSeriesData>;
  /**
   * The index of the current query in the query list (0-based).
   */
  queryIndex?: number;
  // LOGZ.IO CHANGE END:: APPZ-955-math-on-queries-formulas
}

export type TimeSeriesDataQuery = Query<TimeSeriesData, unknown, TimeSeriesData, QueryKey>;
