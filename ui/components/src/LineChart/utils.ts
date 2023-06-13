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
import { getHours, getMinutes, parse } from 'date-fns';
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

const DURATION_TO_RANGE_MS_LOOKUP = {
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
  } else if (rangeMs >= DURATION_TO_RANGE_MS_LOOKUP['1d']) {
    dateFormatOptions.month = 'numeric';
    dateFormatOptions.day = 'numeric';
  }
  const DATE_FORMAT = new Intl.DateTimeFormat(undefined, dateFormatOptions);
  // console.log(dateFormatOptions);
  // remove comma when month / day present
  const formattedDate = DATE_FORMAT.format(value).replace(/, /g, ' ');

  const timeParts = formattedDate.split(':');
  // console.log('timeParts.length ', timeParts.length);
  console.log('rangeMs: ', rangeMs);
  if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['30m']) {
    const secondsString = timeParts[1]?.trim();
    if (secondsString !== undefined) {
      if (parseInt(secondsString) % 30 !== 0) {
        console.log('secondsString... ', secondsString);
        return '';
      }
    }
  } else if (rangeMs <= DURATION_TO_RANGE_MS_LOOKUP['1d']) {
    const minutesString = timeParts[1]?.trim();
    if (minutesString !== undefined) {
      if (parseInt(minutesString) % 5 !== 0) {
        console.log('minutesString... ', minutesString);
        return '';
      }
    }
  }
  // if (rangeMs <= dayMs) {
  //   // const timeParts = formattedDate.split(':');
  //   // console.log('timeParts.length ', timeParts.length);
  //   if (timeParts.length === 3) {
  //     const secondsString = timeParts[2]?.trim();
  //     const minutesString = timeParts[1]?.trim();

  //     if (secondsString && minutesString) {
  //       if (parseInt(secondsString) % 5 !== 0) {
  //         console.log('secondsString cleared... ', secondsString);
  //         // return '';
  //       } else if (parseInt(minutesString) % 5 !== 0) {
  //         console.log('secondsString minutesString... ', minutesString);
  //         return '';
  //       }
  //     }
  //   } else if (timeParts.length === 2) {
  //     const minutesString = timeParts[1]?.trim();
  //     if (minutesString !== undefined) {
  //       if (parseInt(minutesString) % 5 !== 0) {
  //         console.log('secondsString minutesString... ', minutesString);
  //         return '';
  //       }
  //     }
  //   }
  // }

  // const minutesString = formattedDate.split(':')[1]?.trim();
  // if (minutesString !== undefined) {
  //   console.log('getFormattedDate -> minutesString: ', minutesString);
  //   if (parseInt(minutesString) % 5 !== 0) {
  //     return '';
  //   }
  // }

  // const minutes = parseInt(minutesString);
  // const isOddMinutes = minutes % 2 !== 0;

  // const parsedDate = parse(formattedDate, 'yyyy-MM-dd HH:mm:ss', new Date());
  // console.log('getFormattedDate -> parsedDate: ', parsedDate);

  // console.log('getFormattedDate -> formattedDate: ', formattedDate);
  return formattedDate;
}

/*
 * Determines whether a Unix timestamp will have an odd number of minutes.
 */
export function isOddMinutes(value: number): boolean {
  const date = new Date(value);
  const minutes = date.getMinutes();
  return minutes % 2 !== 0;
}

/*
 * Determines whether xAxis is bucketed to human readable rounded values
 */
export function isRoundedInterval(unixTimestamp: number, timeZone?: string): boolean {
  // const date = toDate(unixTimestamp, { timeZone: timeZone });
  const date = new Date(unixTimestamp * 1000);
  const minutes = getMinutes(date);
  console.log('isRoundedInterval -> minutes: ', minutes);
  return minutes % 5 === 0;
}

// export function getDateRange(data: number[]) {
//   const defaultRange = 3600000; // hour in ms
//   if (data.length === 0) return defaultRange;
//   const lastDatum = data[data.length - 1];
//   if (data[0] === undefined || lastDatum === undefined) return defaultRange;
//   return lastDatum - data[0];
// }

// /*
//  * Determines time granularity for axis labels, defaults to hh:mm
//  */
// export function getFormattedDate(value: number, rangeMs: number, timeZone?: string) {
//   const thirtyMinMs = 1800000;
//   const hourMinMs = thirtyMinMs * 2;
//   const dayMs = 86400000;

//   // if (rangeMs <= hourMinMs) {
//   //   console.log('Less than HOUR...');
//   // }

//   // if (isOddMinutes(value)) {
//   //   console.log('getFormattedDate -> isOddMinutes... ', value);
//   //   return '';
//   // }

//   // if (isOddHours(value)) {
//   //   console.log('getFormattedDate -> isOddMinutes... ', value);
//   //   return '';
//   // }

// //   if (!isRoundedInterval(value)) {
// //     console.log('getFormattedDate -> isRoundedInterval... ', value);
// //     return '';
// //   }

//   const dateFormatOptions: Intl.DateTimeFormatOptions = dateFormatOptionsWithTimeZone(
//     {
//       hour: 'numeric',
//       minute: 'numeric',
//       hourCycle: 'h23',
//     },
//     timeZone
//   );

//   // Adjust formatting depending on time range to not show seconds
//   if (rangeMs <= thirtyMinMs) {
//     dateFormatOptions.second = 'numeric';
//   } else if (rangeMs >= dayMs) {
//     dateFormatOptions.month = 'numeric';
//     dateFormatOptions.day = 'numeric';
//   }
//   const DATE_FORMAT = new Intl.DateTimeFormat(undefined, dateFormatOptions);
//   // remove comma when month / day present
//   const formattedDate = DATE_FORMAT.format(value).replace(/, /g, ' ');
//   return formattedDate;
// }

// /*
//  * Determines whether xAxis is bucketed to human readable rounded values
//  */
// export function isRoundedInterval(unixTimestamp: number, timeZone?: string): boolean {
//   // const date = toDate(unixTimestamp, { timeZone: timeZone });
//   const date = new Date(unixTimestamp * 1000);
//   const minutes = getMinutes(date);
//   console.log('isRoundedInterval -> minutes: ', minutes);
//   return minutes % 5 === 0;
// }

// /*
//  * Determines whether a Unix timestamp will have an odd number of minutes.
//  * Useful for bucketing xAxis into whole increments.
//  */
// export function isOddMinutes(unixTimestamp: number): boolean {
//   const date = new Date(unixTimestamp * 1000);
//   const minutes = getMinutes(date);
//   return minutes % 2 !== 0;
// }

// /*
//  * Determines whether a Unix timestamp will have an odd number of hours.
//  */
// export function isOddHours(unixTimestamp: number): boolean {
//   const date = new Date(unixTimestamp * 1000);
//   const hours = getHours(date);
//   return hours % 2 !== 0;
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
