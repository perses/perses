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

import { TimeSeriesValueTuple } from '@perses-dev/core';
import { OptionDataItemObject } from 'echarts/types/src/util/types';
import { LineSeriesOption, ScatterSeriesOption } from 'echarts/charts';
import { LegendItem } from '../';

// TODO: use ComposeOption to fix tooltip type workarounds
// export type ChartsOption = ComposeOption<TooltipComponentOption>;

// adjust display when there are many time series to help with performance
export const OPTIMIZED_MODE_SERIES_LIMIT = 1000;

export type UnixTimeMs = number;

export interface GraphSeries {
  name: string;
  values: TimeSeriesValueTuple[];
}

export type EChartsValues = number | null | '-';

export interface PersesLineSeries extends Omit<LineSeriesOption, 'data'> {
  // TODO: support dataset and both category / time xAxis types
  data: EChartsValues[];
}

export type PersesTimeSeries = PersesLineSeries | PersesScatterSeries;

export type EChartsDataFormat = {
  timeSeries: PersesTimeSeries[];
  xAxis: number[];
  xAxisAlt?: number[]; // TODO: temporary axis for annotations, remove after TimeChart supersedes LineChart
  legendItems?: LegendItem[];
  xAxisMax?: number | string;
  rangeMs?: number;
};

export interface PersesScatterSeries extends Omit<ScatterSeriesOption, 'data'> {
  data: ScatterSeriesData;
  annotations?: unknown[]; // TODO: finalize data model for single annotation and grouped annotations
}

export interface ScatterSeriesDatum extends OptionDataItemObject<TimeSeriesValueTuple> {
  value: TimeSeriesValueTuple;
  categoryColor?: string;
  itemStyle?: {
    color: string;
  };
}

export type ScatterSeriesData = ScatterSeriesDatum[];

export function isScatterSeriesData(data: EChartsValues[] | ScatterSeriesDatum[]): data is ScatterSeriesData {
  if (data.length === 0) return false;
  const scatterSeriesData = data as ScatterSeriesData;
  if (scatterSeriesData !== undefined) {
    if (scatterSeriesData[0] !== undefined) {
      return scatterSeriesData[0].value !== undefined;
    }
  }
  return false;
}

export function isEChartsValue(value: unknown): value is EChartsValues {
  return typeof value === 'number' || value === null || value === '-';
}
