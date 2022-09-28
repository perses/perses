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

import { AbsoluteTimeRange, TimeSeriesQueryDefinition, UnixTimeMs } from '@perses-dev/core';
import { DatasourcesContextType, VariableStateMap } from '../runtime';

/**
 * A plugin for running graph queries.
 */
export interface TimeSeriesQueryPlugin<Spec = unknown> {
  getTimeSeriesData: (
    definition: TimeSeriesQueryDefinition<Spec>,
    ctx: TimeSeriesQueryContext
  ) => Promise<TimeSeriesData>;
}

/**
 * Context available to TimeSeriesQuery plugins at runtime.
 */
export interface TimeSeriesQueryContext {
  suggestedStepMs?: number;
  timeRange: AbsoluteTimeRange;
  variableState: VariableStateMap;
  datasources: DatasourcesContextType;
}

export interface TimeSeriesData {
  timeRange: AbsoluteTimeRange;
  stepMs: number;
  series: Iterable<TimeSeries>;
}

export interface TimeSeries {
  name: string;
  values: Iterable<TimeSeriesValueTuple>;
}

export type TimeSeriesValueTuple = [timestamp: UnixTimeMs, value: number];
