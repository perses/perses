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

import { Duration, sub } from 'date-fns';

export type UnixTimeMs = number;

export type DateTimeFormat = number | string;

export interface AbsoluteTimeRange {
  start: Date;
  end: Date;
}

export interface RelativeTimeRange {
  // End date or undefined if relative to the current Date
  end?: Date;
  pastDuration: DurationString;
}

export type TimeRangeValue = AbsoluteTimeRange | RelativeTimeRange;

/**
 * Determine whether a given time range is relative
 */
export function isRelativeTimeRange(timeRange: TimeRangeValue): timeRange is RelativeTimeRange {
  return (timeRange as RelativeTimeRange).pastDuration !== undefined;
}

/**
 * Determine whether a given time range is absolute
 */
export function isAbsoluteTimeRange(timeRange: TimeRangeValue): timeRange is AbsoluteTimeRange {
  return (timeRange as AbsoluteTimeRange).start !== undefined && (timeRange as AbsoluteTimeRange).end !== undefined;
}

/**
 * Returns an absolute time range from a RelativeTimeRange.
 */
export function toAbsoluteTimeRange(timeRange: RelativeTimeRange): AbsoluteTimeRange {
  const end = timeRange.end ?? new Date();

  return {
    start: sub(end, parseDurationString(timeRange.pastDuration)),
    end,
  };
}

type MillisecondsDurationString = `${number}ms`;
type SecondsDurationString = `${number}s`;
type MinutesDurationString = `${number}m`;
type HoursDurationString = `${number}h`;
type DaysDurationString = `${number}d`;
type WeeksDurationString = `${number}w`;
type YearsDurationString = `${number}y`;

export type DurationString = Exclude<
  `${YearsDurationString | ''}${WeeksDurationString | ''}${DaysDurationString | ''}${HoursDurationString | ''}${
    | MinutesDurationString
    | ''}${SecondsDurationString | ''}${MillisecondsDurationString | ''}`,
  ''
>;

const DURATION_REGEX = /^(?:(\d+)y)?(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?(?:(\d+)ms)?$/;

/**
 * Parses a DurationString into a Duration object with numeric values that can
 * be used to do Date math. Throws if not a valid duration string.
 */
export function parseDurationString(durationString: string): Duration {
  const matches = DURATION_REGEX.exec(durationString);
  if (matches === null) {
    throw new Error(`Invalid duration string '${durationString}'`);
  }

  return {
    years: parseInt(matches[1] ?? '0'),
    months: 0,
    weeks: parseInt(matches[2] ?? '0'),
    days: parseInt(matches[3] ?? '0'),
    hours: parseInt(matches[4] ?? '0'),
    minutes: parseInt(matches[5] ?? '0'),
    seconds: parseInt(matches[6] ?? '0') + parseInt(matches[7] ?? '0') / 1000,
  };
}

/**
 * Returns true if the given string is a valid DurationString.
 */
export function isDurationString(maybeDuration: string): maybeDuration is DurationString {
  if (maybeDuration === '') return false;
  return DURATION_REGEX.test(maybeDuration);
}

/**
 * Round interval to clearer increments
 */
export function roundInterval(interval: number) {
  switch (true) {
    // 0.015s
    case interval < 15:
      return 10; // 0.01s
    // 0.035s
    case interval < 35:
      return 20; // 0.02s
    // 0.075s
    case interval < 75:
      return 50; // 0.05s
    // 0.15s
    case interval < 150:
      return 100; // 0.1s
    // 0.35s
    case interval < 350:
      return 200; // 0.2s
    // 0.75s
    case interval < 750:
      return 500; // 0.5s
    // 1.5s
    case interval < 1500:
      return 1000; // 1s
    // 3.5s
    case interval < 3500:
      return 2000; // 2s
    // 7.5s
    case interval < 7500:
      return 5000; // 5s
    // 12.5s
    case interval < 12500:
      return 10000; // 10s
    // 17.5s
    case interval < 17500:
      return 15000; // 15s
    // 25s
    case interval < 25000:
      return 20000; // 20s
    // 45s
    case interval < 45000:
      return 30000; // 30s
    // 1.5m
    case interval < 90000:
      return 60000; // 1m
    // 3.5m
    case interval < 210000:
      return 120000; // 2m
    // 7.5m
    case interval < 450000:
      return 300000; // 5m
    // 12.5m
    case interval < 750000:
      return 600000; // 10m
    // 12.5m
    case interval < 1050000:
      return 900000; // 15m
    // 25m
    case interval < 1500000:
      return 1200000; // 20m
    // 45m
    case interval < 2700000:
      return 1800000; // 30m
    // 1.5h
    case interval < 5400000:
      return 3600000; // 1h
    // 2.5h
    case interval < 9000000:
      return 7200000; // 2h
    // 4.5h
    case interval < 16200000:
      return 10800000; // 3h
    // 9h
    case interval < 32400000:
      return 21600000; // 6h
    // 1d
    case interval < 86400000:
      return 43200000; // 12h
    // 1w
    case interval < 604800000:
      return 86400000; // 1d
    // 3w
    case interval < 1814400000:
      return 604800000; // 1w
    // 6w
    case interval < 3628800000:
      return 2592000000; // 30d
    default:
      return 31536000000; // 1y
  }
}

/**
 * Gets a suggested step/interval size for a time range based on the width of a visual component.
 */
export function getSuggestedStepMs(timeRange: AbsoluteTimeRange, width: number) {
  // TODO: Should we try to suggest more "rounded" step values based around
  // time increments that make sense (e.g. 15s, 30s, 1m, 5m, etc.)
  const queryRangeMs = timeRange.end.valueOf() - timeRange.start.valueOf();
  const stepMs = Math.floor(queryRangeMs / width);
  const roundedStepMs = roundInterval(stepMs); // TODO: convert this function to ms instead of seconds as param
  return roundedStepMs;
}
