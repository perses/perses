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

import { MAX_SIGNIFICANT_DIGITS } from './constants';
import { UnitGroupConfig, UnitConfig } from './types';
import { hasDecimalPlaces, limitDecimalPlaces } from './utils';

type TimeUnits = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type TimeFormatOptions = {
  unit?: TimeUnits;
  decimalPlaces?: number;
};
const TIME_GROUP = 'Time';
export const TIME_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Time',
  decimalPlaces: true,
};
export const TIME_UNIT_CONFIG: Readonly<Record<TimeUnits, UnitConfig>> = {
  milliseconds: {
    group: TIME_GROUP,
    label: 'Milliseconds',
  },
  seconds: {
    group: TIME_GROUP,
    label: 'Seconds',
  },
  minutes: {
    group: TIME_GROUP,
    label: 'Minutes',
  },
  hours: {
    group: TIME_GROUP,
    label: 'Hours',
  },
  days: {
    group: TIME_GROUP,
    label: 'Days',
  },
  weeks: {
    group: TIME_GROUP,
    label: 'Weeks',
  },
  months: {
    group: TIME_GROUP,
    label: 'Months',
  },
  years: {
    group: TIME_GROUP,
    label: 'Years',
  },
};

// Mapping of time units to what Intl.NumberFormat formatter expects
// https://v8.dev/features/intl-numberformat#units
export enum PersesTimeToIntlTime {
  milliseconds = 'millisecond',
  seconds = 'second',
  minutes = 'minute',
  hours = 'hour',
  days = 'day',
  weeks = 'week',
  months = 'month',
  years = 'year',
}

/**
 * Note: This conversion will not be exactly accurate for months and years,
 * due variations in the lengths of months (i.e. 28 - 31 days) and years (i.e. leap years).
 * For precision with months and years, we would need more complex algorithms and/or external libraries.
 * However, we expect that measurements in months and years will be rare.
 */
const TIME_UNITS_IN_SECONDS: Record<TimeUnits, number> = {
  years: 31536000, // 365 days
  months: 2592000, // 30 days
  weeks: 604800, // 7 days
  days: 86400,
  hours: 3600,
  minutes: 60,
  seconds: 1,
  milliseconds: 0.001,
};

const LARGEST_TO_SMALLEST_TIME_UNITS: TimeUnits[] = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
];

/**
 * Choose the first time unit that produces a number greater than 1, starting from the biggest time unit.
 */
function getValueAndKindForNaturalNumbers(value: number, unit: TimeUnits): { value: number; unit: TimeUnits } {
  const valueInSeconds = value * TIME_UNITS_IN_SECONDS[unit];

  // Initialize for TS
  const largestTimeUnit = LARGEST_TO_SMALLEST_TIME_UNITS[0] || 'years';
  let timeUnit: TimeUnits = largestTimeUnit;
  let valueInTimeUnit: number = valueInSeconds / TIME_UNITS_IN_SECONDS[largestTimeUnit];

  for (timeUnit of LARGEST_TO_SMALLEST_TIME_UNITS) {
    valueInTimeUnit = valueInSeconds / TIME_UNITS_IN_SECONDS[timeUnit];
    if (valueInTimeUnit >= 1) {
      return { value: valueInTimeUnit, unit: timeUnit };
    }
  }

  // If we didn't find a time unit, we have to settle for the smallest time unit (which is the last time unit).
  return { value: valueInTimeUnit, unit: timeUnit };
}

function isMonthOrYear(unit: TimeUnits): boolean {
  return unit === 'months' || unit === 'years';
}

export function formatTime(value: number, { unit, decimalPlaces }: TimeFormatOptions): string {
  if (value === 0) return '0s';

  const results = getValueAndKindForNaturalNumbers(value, unit);

  const formatterOptions: Intl.NumberFormatOptions = {
    style: 'unit',
    unit: PersesTimeToIntlTime[results.unit],
    unitDisplay: isMonthOrYear(results.unit) ? 'long' : 'narrow',
  };

  if (hasDecimalPlaces(decimalPlaces)) {
    formatterOptions.minimumFractionDigits = limitDecimalPlaces(decimalPlaces);
    formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimalPlaces);
  } else {
    formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
  }

  const formatter = Intl.NumberFormat('en-US', formatterOptions);
  return formatter.format(results.value);
}
