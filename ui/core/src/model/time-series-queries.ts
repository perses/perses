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

import { UnknownSpec } from './definitions';
import { QueryDefinition } from './query';
import { UnixTimeMs } from './time';

export type TimeSeriesQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'TimeSeriesQuery', PluginSpec>;

export type TimeSeriesValueTuple = [timestamp: UnixTimeMs, value: number | null];

export type BucketTuple = [number, string, string, string]; // [bucket, upperBound, lowerBound, count]

export type HistogramValue = { count: number; sum: string; buckets?: BucketTuple[] };

export type TimeSeriesHistogramTuple = [unixTimeSeconds: UnixTimeMs, value: HistogramValue];

export function isTimeSeriesValueTuple(data: TimeSeriesValueTuple): data is TimeSeriesValueTuple {
  if (data.length !== 2) return false;
  return true;
}

export type Labels = Record<string, string>;
