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

import { AbsoluteTimeRange, UnixTimeMs, UnknownSpec } from '@perses-dev/core';
import { DatasourceStore, VariableStateMap } from '../runtime';
import { Plugin } from './plugin-base';

/**
 * An object containing all the dependencies of a TimeSeriesQuery.
 */
type TimeSeriesQueryPluginDependencies = {
  /**
   * Returns a list of variables name this time series query depends on.
   */
  variables?: string[];
};

/**
 * A plugin for running time series queries.
 */
export interface TimeSeriesQueryPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getTimeSeriesData: (spec: Spec, ctx: TimeSeriesQueryContext) => Promise<TimeSeriesData>;

  dependsOn?: (spec: Spec, ctx: TimeSeriesQueryContext) => TimeSeriesQueryPluginDependencies;
}

/**
 * Context available to TimeSeriesQuery plugins at runtime.
 */
export interface TimeSeriesQueryContext {
  suggestedStepMs?: number;
  timeRange: AbsoluteTimeRange;
  variableState: VariableStateMap;
  datasourceStore: DatasourceStore;
  refreshKey: string;
}

export interface TimeSeriesData {
  timeRange?: AbsoluteTimeRange;
  stepMs?: number;
  series: Iterable<TimeSeries>;
}

export interface TimeSeries {
  name: string;
  values: Iterable<TimeSeriesValueTuple>;
  formattedName?: string;
}

export type TimeSeriesValueTuple = [timestamp: UnixTimeMs, value: number];
