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

import { AbsoluteTimeRange, UnixTimeMs } from './time';
import { Definition, JsonObject } from './definitions';
import { AnyPluginDefinition, AnyPluginImplementation } from './plugins';
import { ResourceSelector } from './resource';

export interface GraphQueryDefinition<
  Kind extends string,
  Options extends JsonObject
> extends Definition<Kind, Options> {
  datasource?: ResourceSelector;
}

export interface GraphQueryPlugin<
  Kind extends string,
  Options extends JsonObject
> {
  useGraphQuery: UseGraphQueryHook<Kind, Options>;
}

export type UseGraphQueryHook<
  Kind extends string,
  Options extends JsonObject
> = (definition: GraphQueryDefinition<Kind, Options>) => {
  data?: GraphData;
  loading: boolean;
  error?: Error;
};

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

export type AnyGraphQueryDefinition = AnyPluginDefinition<'GraphQuery'>;

export type AnyGraphQueryPlugin = AnyPluginImplementation<'GraphQuery'>;
