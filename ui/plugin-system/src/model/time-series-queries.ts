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
import { LegacyDatasources, VariableStateMap } from '../runtime';

/**
 * A plugin for running graph queries.
 */
export interface TimeSeriesQueryPlugin<Spec = unknown> {
  getGraphData: (definition: TimeSeriesQueryDefinition<Spec>, ctx: TimeSeriesQueryContext) => Promise<GraphData>;
}

/**
 * Context available to TimeSeriesQuery plugins at runtime.
 */
export interface TimeSeriesQueryContext {
  suggestedStepMs?: number;
  timeRange: AbsoluteTimeRange;
  variableState: VariableStateMap;
  datasources: LegacyDatasources;
}

export interface GraphData {
  timeRange: AbsoluteTimeRange;
  stepMs: number;
  series: Iterable<GraphSeries>;
}

export interface GraphSeries {
  name: string;
  values: Iterable<GraphSeriesValueTuple>;
}

export type GraphSeriesValueTuple = [timestamp: UnixTimeMs, value: number];
