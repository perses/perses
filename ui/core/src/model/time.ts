// Copyright 2021 The Perses Authors
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
import { DashboardResource } from './dashboard';

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
 * Determine whether a given time range is in Grafana format
 */
export function isGrafanaRelativeTimeRange(from: string, to: string): boolean {
  return from.startsWith('now-') && to === 'now';
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
 * Gets a suggested step/interval size for a time range based on the width of a visual component.
 */
export function getSuggestedStepMs(timeRange: AbsoluteTimeRange, width: number) {
  // TODO: Should we try to suggest more "rounded" step values based around
  // time increments that make sense (e.g. 15s, 30s, 1m, 5m, etc.)
  const queryRangeMs = timeRange.end.valueOf() - timeRange.start.valueOf();
  return Math.floor(queryRangeMs / width);
}

/**
 * Gets the default time range taking into account URL params
 */
export function getDefaultTimeRange(from: string, to: string, dashboard?: DashboardResource): TimeRangeValue {
  const dashboardDuration = dashboard?.spec.duration ?? '1h';
  const parsedParam = from !== null ? from.split('-')[1] : dashboardDuration;
  const pastDuration = parsedParam && isDurationString(parsedParam) ? parsedParam : dashboardDuration;
  if (from === '' || to === '') return { pastDuration };
  return isGrafanaRelativeTimeRange(from, to)
    ? { pastDuration }
    : { start: new Date(Number(from)), end: new Date(Number(to)) };
}
