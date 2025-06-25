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
import { LineSeriesOption, BarSeriesOption } from 'echarts/charts';
import { ECharts } from 'echarts/core';
import { LegendItem } from '../Legend';

// adjust display when there are many time series to help with performance
export const OPTIMIZED_MODE_SERIES_LIMIT = 1000;

export type UnixTimeMs = number;

export interface GraphSeries {
  name: string;
  values: TimeSeriesValueTuple[];
  id?: string;
}

export type EChartsValues = number | null | '-';

export interface LegacyTimeSeries extends Omit<LineSeriesOption, 'data'> {
  data: EChartsValues[];
}

// Used for TimeChart dataset support, each time series returned is mapped to series options using datasetIndex
// - https://apache.github.io/echarts-handbook/en/concepts/dataset/#how-to-reference-several-datasets
export type TimeChartSeriesMapping = TimeSeriesOption[];
export type TimeChartLegendItems = LegendItem[];

export type TimeSeriesOption = LineSeriesOption | BarSeriesOption;

// [DEPRECATED] used for legacy LineChart 'category' axis.
// May delete in future when embed users migrate to TimeChart.
export type EChartsDataFormat = {
  timeSeries: LegacyTimeSeries[];
  xAxis: number[];
  legendItems?: LegendItem[];
  xAxisMax?: number | string;
  rangeMs?: number;
};

// Intentionally making this an object to start because it is plausible we will
// want to support focusing by other attributes (e.g. index, name) in the future,
// and starting with an object will make adding them a non-breaking change.
export type ChartInstanceFocusOpts = {
  id?: string; // LineChart uses id
  name?: string; // TimeChart uses name
};

export type ChartInstance = {
  chartInstance: ECharts | undefined; // LOGZ.IO CHANGE:: Alert annotations [APPZ-477]
  /**
   * Highlight the series associated with the specified options.
   */
  highlightSeries: (opts: ChartInstanceFocusOpts) => void;

  /**
   * Clear all highlighted series.
   */
  clearHighlightedSeries: () => void;
};

export const PINNED_CROSSHAIR_SERIES_NAME = 'Pinned Crosshair';

export const DEFAULT_PINNED_CROSSHAIR: LineSeriesOption = {
  name: PINNED_CROSSHAIR_SERIES_NAME,
  type: 'line',
  // https://echarts.apache.org/en/option.html#series-line.markLine
  markLine: {
    data: [],
    lineStyle: {
      type: 'dashed',
      width: 2,
    },
    emphasis: {
      lineStyle: {
        width: 2,
        opacity: 1,
      },
    },
    blur: {
      lineStyle: {
        width: 2,
        opacity: 1,
      },
    },
  },
};

export interface DatapointInfo {
  dataIndex: number;
  seriesIndex: number;
  seriesName: string;
  yValue: number;
}
