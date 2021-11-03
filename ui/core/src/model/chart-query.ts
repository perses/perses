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

import { UnixTimeMs } from '..';
import { AbsoluteTimeRange } from './time';
import { Definition, JsonObject } from './definitions';
import { AnyPluginDefinition, AnyPluginImplementation } from './plugins';
import { ResourceSelector } from './resource';

export interface ChartQueryDefinition<
  Kind extends string,
  Options extends JsonObject
> extends Definition<Kind, Options> {
  datasource?: ResourceSelector;
}

export interface ChartQueryPlugin<
  Kind extends string,
  Options extends JsonObject
> {
  useChartQuery: UseChartQueryHook<Kind, Options>;
}

export type UseChartQueryHook<
  Kind extends string,
  Options extends JsonObject
> = (definition: ChartQueryDefinition<Kind, Options>) => {
  data?: ChartData;
  loading: boolean;
  error?: Error;
};

export interface ChartData {
  timeRange: AbsoluteTimeRange;
  stepMs: number;
  series: Iterable<ChartSeries>;
}

export interface ChartSeries {
  name: string;
  values: Iterable<ChartValueTuple>;
}

export type ChartValueTuple = [timestamp: UnixTimeMs, value: number];

export type AnyChartQueryDefinition = AnyPluginDefinition<'ChartQuery'>;

export type AnyChartQueryPlugin = AnyPluginImplementation<'ChartQuery'>;
