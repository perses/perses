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

import { merge } from 'lodash-es';
import type { YAXisComponentOption } from 'echarts';
import { ECharts as EChartsInstance } from 'echarts/core';
import { formatValue, UnitOptions } from '../model';
import { dateFormatOptionsWithTimeZone } from '../utils';

export interface ZoomEventData {
  start: number;
  end: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Enable dataZoom without requring user to click toolbox icon
 */
export function enableDataZoom(chart: EChartsInstance) {
  const chartModel = chart['_model'];
  if (chartModel === undefined) return;
  if (chartModel.option.toolbox !== undefined && chartModel.option.toolbox.length > 0) {
    // check if hidden data zoom icon is unselected (if selected it would be 'emphasis' instead of 'normal')
    if (chartModel.option.toolbox[0].feature.dataZoom.iconStatus.zoom === 'normal') {
      chart.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'dataZoomSelect',
        dataZoomSelectActive: true,
      });
    }
  }
}

/**
 * Restore chart to original state before zoom or other actions were dispatched
 */
export function restoreChart(chart: EChartsInstance) {
  // TODO: support incremental unzoom instead of restore to original state
  chart.dispatchAction({
    type: 'restore', // https://echarts.apache.org/en/api.html#events.restore
  });
}

/**
 * Calculate date range, used as a fallback when xAxis time range not passed as prop
 */
export function getDateRange(data: number[]) {
  const defaultRange = 3600000; // hour in ms
  if (data.length === 0) return defaultRange;
  const lastDatum = data[data.length - 1];
  if (data[0] === undefined || lastDatum === undefined) return defaultRange;
  return lastDatum - data[0];
}

/*
 * Determines time granularity for axis labels, defaults to hh:mm
 */
export function getFormattedDate(value: number, rangeMs: number, timeZone?: string) {
  const dateFormatOptions: Intl.DateTimeFormatOptions = dateFormatOptionsWithTimeZone(
    {
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    },
    timeZone
  );
  const thirtyMinMs = 1800000;
  const dayMs = 86400000;
  if (rangeMs <= thirtyMinMs) {
    dateFormatOptions.second = 'numeric';
  } else if (rangeMs >= dayMs) {
    dateFormatOptions.month = 'numeric';
    dateFormatOptions.day = 'numeric';
  }
  const DATE_FORMAT = new Intl.DateTimeFormat(undefined, dateFormatOptions);
  // remove comma when month / day present
  return DATE_FORMAT.format(value).replace(/, /g, ' ');
}

/*
 * Populate yAxis properties, returns an Array since multiple y axes will be supported in the future
 */
export function getYAxes(yAxis?: YAXisComponentOption, unit?: UnitOptions) {
  // TODO: support alternate yAxis that shows on right side
  const Y_AXIS_DEFAULT = {
    type: 'value',
    boundaryGap: [0, '10%'],
    axisLabel: {
      formatter: (value: number) => {
        return formatValue(value, unit);
      },
    },
  };
  return [merge(Y_AXIS_DEFAULT, yAxis)];
}
