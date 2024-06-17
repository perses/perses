// Copyright 2024 The Perses Authors
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

import { isBefore, isValid } from 'date-fns';
import { AbsoluteTimeRange, isRelativeTimeRange, TimeRangeValue } from '@perses-dev/core';
import { formatWithTimeZone } from '../utils';

export const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

export interface CustomTimeOption {
  value: TimeRangeValue | undefined;
  display: string;
}

export function buildCustomTimeOption(value: AbsoluteTimeRange | undefined, timeZone: string): CustomTimeOption {
  return { value, display: formatTimeRange(value, timeZone) };
}

/**
 * Date validation and check if end is after start
 */
export function validateDateRange(startDate: Date, endDate: Date) {
  // TODO: display error as helperText
  if (!isValid(startDate) || !isValid(endDate)) {
    console.error('Invalid Date');
    return false;
  }
  if (!isBefore(startDate, endDate)) {
    console.error('End Time is before Start Time');
    return false;
  }
  return true;
}

/**
 * Format start and end time based on provided date format
 * @param timeRange absolute time range with a start and end datetime
 * @param dateFormat date format string
 * @param timeZone
 */
export function formatAbsoluteRange(timeRange: AbsoluteTimeRange, dateFormat: string, timeZone?: string) {
  const formattedStart = formatWithTimeZone(timeRange.start, dateFormat, timeZone);
  const formattedEnd = formatWithTimeZone(timeRange.end, dateFormat, timeZone);
  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Format the time range for display purpose only (e.g. in the selector)
 * @param value
 * @param timeZone
 */
export function formatTimeRange(value: TimeRangeValue | undefined, timeZone: string) {
  if (!value) {
    return 'Custom Time Range';
  }
  return !isRelativeTimeRange(value) ? formatAbsoluteRange(value, DATE_TIME_FORMAT, timeZone) : value.pastDuration;
}
