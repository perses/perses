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

import { Notice } from './notice';
import { AbsoluteTimeRange } from './time';
import { Labels, TimeSeriesValueTuple } from './time-series-queries';

export interface TimeScale {
  startMs: number;
  endMs: number;
  stepMs: number;
}

export interface TimeSeriesData {
  timeRange?: AbsoluteTimeRange;
  stepMs?: number;
  series: TimeSeries[];
  metadata?: TimeSeriesMetadata;
}

export interface TimeSeries {
  name: string;
  values: TimeSeriesValueTuple[];
  formattedName?: string;
  labels?: Labels;
}

export interface TimeSeriesMetadata {
  notices?: Notice[];
}

// export const timeSeriesAggregationValues = [
//   'AverageNonNull',
//   'FirstNonNull',
//   'LastNonNull',
//   'Min',
//   'Max',
//   'Total',
// ] as const;
// export type TimeSeriesAggregationValue = (typeof timeSeriesAggregationValues)[number];
