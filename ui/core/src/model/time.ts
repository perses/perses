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

const DEFAULT_STEP_MS = 15000;

const ROUNDED_STEP_INTERVALS = [
  // max: 0.015s
  { maxMs: 15, roundedStepMs: 10, display: '0.01s' },
  // max: 0.035s
  { maxMs: 35, roundedStepMs: 20, display: '0.02s' },
  // max: 0.075s
  { maxMs: 75, roundedStepMs: 50, display: '0.05s' },
  // max: 0.15s
  { maxMs: 150, roundedStepMs: 100, display: '0.1s' },
  // max: 0.35s
  { maxMs: 350, roundedStepMs: 200, display: '0.2s' },
  // max: 0.75s
  { maxMs: 750, roundedStepMs: 500, display: '0.5s' },
  // max: 1.5s
  { maxMs: 1500, roundedStepMs: 1000, display: '1s' },
  // max: 3.5s
  { maxMs: 3500, roundedStepMs: 2000, display: '2s' },
  // max: 7.5s
  { maxMs: 7500, roundedStepMs: 5000, display: '5s' },
  // max: 12.5s
  { maxMs: 12500, roundedStepMs: 10000, display: '10s' },
  // max: 17.5s
  { maxMs: 17500, roundedStepMs: 15000, display: '15s' },
  // max: 25s
  { maxMs: 25000, roundedStepMs: 20000, display: '20s' },
  // max: 45s
  { maxMs: 45000, roundedStepMs: 30000, display: '30s' },
  // max: 1.5m
  { maxMs: 90000, roundedStepMs: 60000, display: '1m' },
  // max: 3.5m
  { maxMs: 210000, roundedStepMs: 120000, display: '2m' },
  // max: 7.5m
  { maxMs: 450000, roundedStepMs: 300000, display: '5m' },
  // max: 12.5m
  { maxMs: 750000, roundedStepMs: 600000, display: '10m' },
  // max: 12.5m
  { maxMs: 1050000, roundedStepMs: 900000, display: '15m' },
  // max: 25m
  { maxMs: 1500000, roundedStepMs: 1200000, display: '20m' },
  // max: 45m
  { maxMs: 2700000, roundedStepMs: 1800000, display: '30m' },
  // max: 1.5h
  { maxMs: 5400000, roundedStepMs: 3600000, display: '1h' },
  // max: 2.5h
  { maxMs: 9000000, roundedStepMs: 7200000, display: '2h' },
  // max: 4.5h
  { maxMs: 16200000, roundedStepMs: 10800000, display: '3h' },
  // max: 9h
  { maxMs: 32400000, roundedStepMs: 21600000, display: '6h' },
  // max: 1d
  { maxMs: 86400000, roundedStepMs: 43200000, display: '12h' },
  // max: 1w
  { maxMs: 604800000, roundedStepMs: 86400000, display: '1d' },
  // max: 3w
  { maxMs: 1814400000, roundedStepMs: 604800000, display: '1w' },
  // max: 6w
  { maxMs: 3628800000, roundedStepMs: 2592000000, display: '30d' },
  // max: 2y
  { maxMs: 63072000000, roundedStepMs: 31536000000, display: '1y' },
];

/**
 * Round interval to clearer increments
 */
export function roundStepInterval(stepMs: number) {
  for (const { maxMs, roundedStepMs } of ROUNDED_STEP_INTERVALS) {
    if (stepMs < maxMs) {
      return roundedStepMs;
    }
  }
  return DEFAULT_STEP_MS;
}

/**
 * Gets a suggested step/interval size for a time range based on the width of a visual component.
 */
export function getSuggestedStepMs(timeRange: AbsoluteTimeRange, width: number) {
  const queryRangeMs = timeRange.end.valueOf() - timeRange.start.valueOf();
  const stepMs = Math.floor(queryRangeMs / width);
  return roundStepInterval(stepMs);
}
