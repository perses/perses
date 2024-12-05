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

import { formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';

export function dateFormatOptionsWithTimeZone(dateFormatOptions: Intl.DateTimeFormatOptions, timeZone?: string) {
  /*
   * if timeZone is provided, and is not local|browser,
   * then set timeZone option (recognize UTC regardless of uppercase/lowercase)
   * otherwise, default to browser timeZone setting
   */
  if (timeZone) {
    const lowerTimeZone = timeZone.toLowerCase();
    if (lowerTimeZone !== 'local' && lowerTimeZone !== 'browser') {
      return {
        ...dateFormatOptions,
        timeZone: lowerTimeZone === 'utc' ? 'UTC' : timeZone,
      };
    }
  }
  return dateFormatOptions;
}

export function formatWithTimeZone(date: Date, formatString: string, timeZone?: string) {
  /*
   * if timeZone is provided, and is not local|browser,
   * then format using timeZone option (recognize UTC regardless of uppercase/lowercase)
   * otherwise, format without timeZone option, defaulting to browser timeZone setting
   */
  const lowerTimeZone = timeZone?.toLowerCase();
  if (!timeZone || lowerTimeZone === 'local' || lowerTimeZone === 'browser') {
    return format(date, formatString);
  } else {
    return formatInTimeZone(date, lowerTimeZone === 'utc' ? 'UTC' : timeZone, formatString);
  }
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

// https://echarts.apache.org/en/option.html#xAxis.axisLabel.formatter
export function getFormattedAxisLabel(rangeMs: number) {
  const dayMs = 86400000;
  const monthMs = 2629440000;
  const yearMs = 31536000000;

  // more than 5 years
  if (rangeMs > yearMs * 5) {
    return '{yyyy}';
  }

  // more than 2 years
  if (rangeMs > yearMs * 2) {
    return '{MMM} {yyyy}';
  }

  // between 5 days to 6 months
  if (rangeMs > dayMs * 5 && rangeMs < monthMs * 6) {
    return '{MM}/{dd}'; // 12/01
  }

  // between 2 and 5 days
  if (rangeMs > dayMs * 2 && rangeMs <= dayMs * 5) {
    return '{MM}/{dd} {HH}:{mm}'; // 12/01 12:30
  }

  return {
    year: '{yearStyle|{yyyy}}\n{monthStyle|{MMM}}',
    month: '{MMM}', // Jan, Feb, ...
    day: '{MM}/{dd}',
  };
}

interface FormattedDateTime {
  formattedDate: string;
  formattedTime: string;
}

export const getDateAndTime = (timeMs?: number): FormattedDateTime => {
  if (!timeMs) {
    return { formattedDate: '', formattedTime: '' };
  }
  const date = new Date(timeMs);
  const formattedDate = format(date, 'MMM dd, yyyy - ');
  const formattedTime = format(date, 'HH:mm:ss');
  return {
    formattedDate,
    formattedTime,
  };
};
