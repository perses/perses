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

import merge from 'lodash/merge';
import type { YAXisComponentOption } from 'echarts';
import { ECharts as EChartsInstance } from 'echarts/core';
import { getMinutes } from 'date-fns';
import { formatValue, UnitOptions } from '../model';
import { dateFormatOptionsWithTimeZone } from '../utils';

export const DURATION_TO_RANGE_MS_LOOKUP = {
  '5m': 300000,
  '15m': 900000,
  '30m': 1800000,
  '1h': 3600000,
  '6h': 21600000,
  '12h': 43200000,
  '1d': 86400000,
  '7d': 604800000,
  '14d': 1209600000,
};

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

/**
 * Calculate date range, used as a fallback when xAxis time range not passed as prop
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
  if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['30m']) {
    dateFormatOptions.second = 'numeric';
    dateFormatOptions.hour = undefined;
  } else if (rangeMs < DURATION_TO_RANGE_MS_LOOKUP['1d']) {
    dateFormatOptions.hour = 'numeric';
    dateFormatOptions.minute = 'numeric';
  } else if (rangeMs === DURATION_TO_RANGE_MS_LOOKUP['1d']) {
    dateFormatOptions.month = 'numeric';
    dateFormatOptions.day = 'numeric';
    dateFormatOptions.hour = undefined;
    dateFormatOptions.minute = undefined;
  } else if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['7d']) {
    dateFormatOptions.month = 'numeric';
    dateFormatOptions.day = 'numeric';
    dateFormatOptions.hour = undefined;
    dateFormatOptions.minute = undefined;
  } else if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['14d']) {
    dateFormatOptions.month = 'numeric';
    dateFormatOptions.day = 'numeric';
    dateFormatOptions.hour = undefined;
    dateFormatOptions.minute = undefined;
  } else {
    dateFormatOptions.month = 'numeric';
    dateFormatOptions.day = undefined;
    dateFormatOptions.hour = undefined;
    dateFormatOptions.minute = undefined;
  }
  const DATE_FORMAT = new Intl.DateTimeFormat(undefined, dateFormatOptions);

  // remove comma when month / day present
  const formattedDate = DATE_FORMAT.format(value).replace(/, /g, ' ');

  const timeParts = formattedDate.split(':');

  if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['15m']) {
    const secondsString = timeParts[1]?.trim();
    if (secondsString !== undefined) {
      if (parseInt(secondsString) % 2 !== 0) {
        return '';
      }
    }
  } else if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['30m']) {
    const secondsString = timeParts[1]?.trim();
    if (secondsString !== undefined) {
      if (parseInt(secondsString) % 30 !== 0) {
        return '';
      }
    }
  } else if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['1h']) {
    const minutesString = timeParts[1]?.trim();
    if (minutesString !== undefined) {
      if (parseInt(minutesString) % 10 !== 0) {
        return '';
      }
    }
  } else if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['6h']) {
    const minutesString = timeParts[1]?.trim();
    if (minutesString !== undefined) {
      if (parseInt(minutesString) % 30 !== 0) {
        return '';
      }
    }
  } else if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['1d']) {
    const minutesString = timeParts[1]?.trim();
    if (minutesString !== undefined) {
      if (parseInt(minutesString) % 30 !== 0) {
        return '';
      }
    }
  }

  return formattedDate;
}

// /*
//  * Determines whether a Unix timestamp will have an odd number of minutes.
//  */
// export function isOddMinutes(value: number): boolean {
//   const date = new Date(value);
//   const minutes = date.getMinutes();
//   return minutes % 2 !== 0;
// }

// /*
//  * Determines whether xAxis is bucketed to human readable rounded values
//  */
// export function isRoundedInterval(unixTimestamp: number, timeZone?: string): boolean {
//   // const date = toDate(unixTimestamp, { timeZone: timeZone });
//   const date = new Date(unixTimestamp * 1000);
//   const minutes = getMinutes(date);
//   return minutes % 5 === 0;
// }

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
