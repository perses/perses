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

export interface TimeSeriesQueryDefinition<
  Kind extends string,
  Options extends JsonObject
> extends Definition<Kind, Options> {
  datasource?: ResourceSelector;
}

export interface TimeSeriesQueryPlugin<
  Kind extends string,
  Options extends JsonObject
> {
  useTimeSeriesQuery: UseTimeSeriesQueryHook<Kind, Options>;
}

export type UseTimeSeriesQueryHook<
  Kind extends string,
  Options extends JsonObject
> = (definition: TimeSeriesQueryDefinition<Kind, Options>) => {
  data?: TimeSeriesData;
  loading: boolean;
  error?: Error;
};

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

export type AnyTimeSeriesQueryDefinition =
  AnyPluginDefinition<'TimeSeriesQuery'>;

export type AnyTimeSeriesQueryPlugin =
  AnyPluginImplementation<'TimeSeriesQuery'>;
