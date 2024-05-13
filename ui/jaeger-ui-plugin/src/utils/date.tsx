// Copyright (c) 2017 Uber Technologies, Inc.
//
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

import dayjs, { ConfigType } from 'dayjs';
import _dropWhile from 'lodash/dropWhile';
import _round from 'lodash/round';
import _duration, { DurationUnitType } from 'dayjs/plugin/duration';

import { toFloatPrecision } from './number';

dayjs.extend(_duration);

const TODAY = 'Today';
const YESTERDAY = 'Yesterday';

export const STANDARD_DATE_FORMAT = 'YYYY-MM-DD';
export const STANDARD_TIME_FORMAT = 'HH:mm';
export const STANDARD_DATETIME_FORMAT = 'MMMM D YYYY, HH:mm:ss.SSS';

/** @constant 1ms as the number of microseconds, which is the precision of Jaeger timestamps */
export const ONE_MILLISECOND = 1000 * 1;

const ONE_SECOND = 1000 * ONE_MILLISECOND;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const DEFAULT_MS_PRECISION = Math.log10(ONE_MILLISECOND);

const UNIT_STEPS: { unit: string; microseconds: number; ofPrevious: number }[] = [
  { unit: 'd', microseconds: ONE_DAY, ofPrevious: 24 },
  { unit: 'h', microseconds: ONE_HOUR, ofPrevious: 60 },
  { unit: 'm', microseconds: ONE_MINUTE, ofPrevious: 60 },
  { unit: 's', microseconds: ONE_SECOND, ofPrevious: 1000 },
  { unit: 'ms', microseconds: ONE_MILLISECOND, ofPrevious: 1000 },
  { unit: 'μs', microseconds: 1, ofPrevious: 1000 },
];

type ShortTimeUnit = 'μs' | 'ms' | 's' | 'm' | 'h' | 'd';
type LongTimeUnit = 'microseconds' | 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days';

const timeUnitToShortTermMapper: {
  [key in LongTimeUnit]: ShortTimeUnit;
} = {
  microseconds: 'μs',
  milliseconds: 'ms',
  seconds: 's',
  minutes: 'm',
  hours: 'h',
  days: 'd',
} as const;

/**
 * @param {number} timestamp
 * @param {number} initialTimestamp
 * @param {number} totalDuration
 * @return {number} 0-100 percentage
 */
export function getPercentageOfDuration(duration: number, totalDuration: number): number {
  return (duration / totalDuration) * 100;
}

const quantizeDuration = (duration: number, floatPrecision: number, conversionFactor: number): number =>
  toFloatPrecision(duration / conversionFactor, floatPrecision) * conversionFactor;

/**
 * @param {number} duration - Unix Time
 * @return {string} formatted, unit-labelled string with time in milliseconds
 *
 * @example
 * ```
 * formatDate(0) // => 1970-01-01
 * ```
 */
export function formatDate(duration: number): string {
  return dayjs(duration / ONE_MILLISECOND).format(STANDARD_DATE_FORMAT);
}

/**
 * @param {number} duration - Unix Time
 * @return {string} formatted, unit-labelled string with time in milliseconds
 *
 * @example
 * ```
 * formatTime(0) // => 00:00
 * ```
 */
export function formatTime(duration: number): string {
  return dayjs(duration / ONE_MILLISECOND).format(STANDARD_TIME_FORMAT);
}

/**
 * @param {number} duration - Unix Time
 * @return {string} formatted, unit-labelled string with time in milliseconds
 *
 * @example
 * ```
 * formatDatetime(0) // => January 1 1970, 00:00:00.000
 * ```
 */
export function formatDatetime(duration: number): string {
  return dayjs(duration / ONE_MILLISECOND).format(STANDARD_DATETIME_FORMAT);
}

/**
 * @param {number} duration - Unix Time
 * @return {string} formatted, unit-labelled string with time in milliseconds
 *
 * @example
 * ```
 * formatMillisecondTime(1_000) // => 1ms
 * formatMillisecondTime(10_000) // => 10ms
 * ```
 */
export function formatMillisecondTime(duration: number): string {
  const targetDuration = quantizeDuration(duration, DEFAULT_MS_PRECISION, ONE_MILLISECOND);
  return `${dayjs.duration(targetDuration / ONE_MILLISECOND).asMilliseconds()}ms`;
}

/**
 * @param {number} duration - Unix Time
 * @return {string} formatted, unit-labelled string with time in seconds
 *
 * @example
 * ```
 * formatSecondTime(1_000_000) // => 1s
 * formatSecondTime(10_000_000) // => 10s
 * ```
 */
export function formatSecondTime(duration: number): string {
  const targetDuration = quantizeDuration(duration, DEFAULT_MS_PRECISION, ONE_SECOND);
  return `${dayjs.duration(targetDuration / ONE_MILLISECOND).asSeconds()}s`;
}

/**
 * Humanizes the duration for display.
 *
 * @example
 * 5000ms => 5s
 * 1000μs => 1ms
 * 183840s => 2d 3h
 *
 * @param {number} duration - Unix Time
 * @return {string} formatted duration
 */
export function formatDuration(duration: number): string {
  // Drop all units that are too large except the last one
  const [primaryUnit, secondaryUnit] = _dropWhile(
    UNIT_STEPS,
    ({ microseconds }, index) => index < UNIT_STEPS.length - 1 && microseconds > duration
  );

  if (primaryUnit.ofPrevious === 1000) {
    // If the unit is decimal based, display as a decimal
    return `${_round(duration / primaryUnit.microseconds, 2)}${primaryUnit.unit}`;
  }

  const primaryValue = Math.floor(duration / primaryUnit.microseconds);
  const primaryUnitString = `${primaryValue}${primaryUnit.unit}`;
  const secondaryValue = Math.round((duration / secondaryUnit.microseconds) % primaryUnit.ofPrevious);
  const secondaryUnitString = `${secondaryValue}${secondaryUnit.unit}`;
  return secondaryValue === 0 ? primaryUnitString : `${primaryUnitString} ${secondaryUnitString}`;
}

export function formatRelativeDate(value: ConfigType, fullMonthName = false): string {
  const m = dayjs.isDayjs(value) ? value : dayjs(value);

  const monthFormat = fullMonthName ? 'MMMM' : 'MMM';
  const dt = new Date();
  if (dt.getFullYear() !== m.year()) {
    return m.format(`${monthFormat} D, YYYY`);
  }
  const mMonth = m.month();
  const mDate = m.date();
  const date = dt.getDate();
  if (mMonth === dt.getMonth() && mDate === date) {
    return TODAY;
  }
  dt.setDate(date - 1);
  if (mMonth === dt.getMonth() && mDate === dt.getDate()) {
    return YESTERDAY;
  }
  return m.format(`${monthFormat} D`);
}

export const getSuitableTimeUnit = (microseconds: number): LongTimeUnit => {
  if (microseconds < 1000) {
    return 'microseconds';
  }

  const durationInMilliseconds = dayjs.duration(microseconds / 1000, 'ms');

  const longUnitsDescending: Exclude<LongTimeUnit, 'microseconds'>[] = [
    'days',
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
  ];

  return longUnitsDescending.find(timeUnit => {
    const durationInTimeUnit = durationInMilliseconds.as(timeUnit);

    return durationInTimeUnit >= 1;
  })!;
};

export function convertTimeUnitToShortTerm(timeUnit: LongTimeUnit): ShortTimeUnit | '' {
  return timeUnitToShortTermMapper[timeUnit] ?? '';
}

export function convertToTimeUnit(microseconds: number, targetTimeUnit: string): number {
  if (microseconds < 1000) {
    return microseconds;
  }

  return dayjs.duration(microseconds / 1000, 'ms').as(targetTimeUnit as DurationUnitType);
}

export function timeConversion(microseconds: number): string {
  if (microseconds < 1000) {
    return `${microseconds}μs`;
  }

  const timeUnit = getSuitableTimeUnit(microseconds) as Exclude<LongTimeUnit, 'microseconds'>;

  return `${dayjs.duration(microseconds / 1000, 'ms').as(timeUnit)}${convertTimeUnitToShortTerm(timeUnit)}`;
}
