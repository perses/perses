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

import { MouseEventHandler } from 'react';
import { LineSeriesOption } from 'echarts/charts';

export const OPTIMIZED_MODE_SERIES_LIMIT = 500;

export type UnixTimeMs = number;

export type GraphSeriesValueTuple = [timestamp: UnixTimeMs, value: number];

export interface GraphSeries {
  name: string;
  values: Iterable<GraphSeriesValueTuple>;
}

export type EChartsValues = number | null | '-';

export interface EChartsTimeSeries extends Omit<LineSeriesOption, 'data'> {
  // TODO: support dataset and both category / time xAxis types
  data: Iterable<GraphSeriesValueTuple> | EChartsValues[];
}

export type EChartsDataFormat = {
  timeSeries: EChartsTimeSeries[];
  xAxis: number[];
  legendItems?: LegendItem[];
  xAxisMax?: number | string;
  rangeMs?: number;
};

/**
 * Supported legend options
 */
export interface LegendOptions {
  position?: 'bottom' | 'right';
}

export interface LegendItem {
  id: string;
  label: string;
  isSelected: boolean;
  color: string;
  onClick: MouseEventHandler<HTMLLIElement>;
}
