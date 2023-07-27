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

const timeUnitKinds = ['Milliseconds', 'Seconds', 'Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years'] as const;
type TimeUnitKind = (typeof timeUnitKinds)[number];
export type TimeUnitOptions = {
  kind: TimeUnitKind;
  decimal_places?: number;
};
const TIME_GROUP = 'Time';
export const TIME_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Time',
  decimal_places: true,
};
export const TIME_UNIT_CONFIG: Readonly<Record<TimeUnitKind, UnitConfig>> = {
  Milliseconds: {
    group: TIME_GROUP,
    label: 'Milliseconds',
  },
  Seconds: {
    group: TIME_GROUP,
    label: 'Seconds',
  },
  Minutes: {
    group: TIME_GROUP,
    label: 'Minutes',
  },
  Hours: {
    group: TIME_GROUP,
    label: 'Hours',
  },
  Days: {
    group: TIME_GROUP,
    label: 'Days',
  },
  Weeks: {
    group: TIME_GROUP,
    label: 'Weeks',
  },
  Months: {
    group: TIME_GROUP,
    label: 'Months',
  },
  Years: {
    group: TIME_GROUP,
    label: 'Years',
  },
};

// Mapping of time units to what Intl.NumberFormat formatter expects
// https://v8.dev/features/intl-numberformat#units
export enum PersesTimeToIntlTime {
  Milliseconds = 'millisecond',
  Seconds = 'second',
  Minutes = 'minute',
  Hours = 'hour',
  Days = 'day',
  Weeks = 'week',
  Months = 'month',
  Years = 'year',
}

/**
 * Note: This conversion will not be exactly accurate for months and years,
 * due variations in the lengths of months (i.e. 28 - 31 days) and years (i.e. leap years).
 * For precision with months and years, we would need more complex algorithms and/or external libraries.
 * However, we expect that measurements in months and years will be rare.
 */
const TIME_UNITS_IN_SECONDS: Record<TimeUnitKind, number> = {
  Years: 31536000, // 365 days
  Months: 2592000, // 30 days
  Weeks: 604800,
  Days: 86400,
  Hours: 3600,
  Minutes: 60,
  Seconds: 1,
  Milliseconds: 0.001,
};

const LARGEST_TO_SMALLEST_TIME_UNITS: TimeUnitKind[] = [
  'Years',
  'Months',
  'Weeks',
  'Days',
  'Hours',
  'Minutes',
  'Seconds',
  'Milliseconds',
];

/**
 * Choose the first time unit that produces a number greater than 1, starting from the biggest time unit.
 */
function getValueAndKindForNaturalNumbers(value: number, kind: TimeUnitKind): { value: number; kind: TimeUnitKind } {
  const valueInSeconds = value * TIME_UNITS_IN_SECONDS[kind];

  // Initialize for TS
  const largestTimeUnit = LARGEST_TO_SMALLEST_TIME_UNITS[0] || 'Years';
  let timeUnit: TimeUnitKind = largestTimeUnit;
  let valueInTimeUnit: number = valueInSeconds / TIME_UNITS_IN_SECONDS[largestTimeUnit];

  for (timeUnit of LARGEST_TO_SMALLEST_TIME_UNITS) {
    valueInTimeUnit = valueInSeconds / TIME_UNITS_IN_SECONDS[timeUnit];
    if (valueInTimeUnit >= 1) {
      return { value: valueInTimeUnit, kind: timeUnit };
    }
  }

  // If we didn't find a time unit, we have to settle for the smallest time unit (which is the last time unit).
  return { value: valueInTimeUnit, kind: timeUnit };
}

function isMonthOrYear(kind: TimeUnitKind): boolean {
  return kind === 'Months' || kind === 'Years';
}

export function formatTime(value: number, { kind, decimal_places }: TimeUnitOptions): string {
  if (value === 0) return '0s';

  const results = getValueAndKindForNaturalNumbers(value, kind);

  const formatterOptions: Intl.NumberFormatOptions = {
    style: 'unit',
    unit: PersesTimeToIntlTime[results.kind],
    unitDisplay: isMonthOrYear(results.kind) ? 'long' : 'narrow',
  };

  if (hasDecimalPlaces(decimal_places)) {
    formatterOptions.minimumFractionDigits = limitDecimalPlaces(decimal_places);
    formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimal_places);
  } else {
    formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
  }

  const formatter = Intl.NumberFormat('en-US', formatterOptions);
  return formatter.format(results.value);
}
