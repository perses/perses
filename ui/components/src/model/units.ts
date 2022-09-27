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

import { Duration, milliseconds } from 'date-fns';
import { round } from 'mathjs';

export const DEFAULT_DECIMAL_PLACES = 2;

export type UnitOptions = TimeUnitOptions | PercentUnitOptions | DecimalUnitOptions | BytesUnitOptions;

export function formatValue(value: number, unitOptions?: UnitOptions): string {
  if (unitOptions === undefined) {
    return value.toString();
  }

  if (isDecimalUnit(unitOptions)) {
    return formatDecimal(value, unitOptions);
  }

  if (isTimeUnit(unitOptions)) {
    return formatTime(value, unitOptions);
  }

  if (isPercentUnit(unitOptions)) {
    return formatPercent(value, unitOptions);
  }

  if (isBytesUnit(unitOptions)) {
    const decimals = unitOptions.decimal_places ?? DEFAULT_DECIMAL_PLACES;
    return formatBytes(value, decimals);
  }

  const exhaustive: never = unitOptions;
  throw new Error(`Unknown unit options ${exhaustive}`);
}

/* Time Unit Conversion */
const timeUnitKinds = ['Milliseconds', 'Seconds', 'Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years'] as const;
const timeUnitKindsSet = new Set<string>(timeUnitKinds);

type TimeUnitOptions = {
  kind: typeof timeUnitKinds[number];
};

function isTimeUnit(unitOptions: UnitOptions): unitOptions is TimeUnitOptions {
  return timeUnitKindsSet.has(unitOptions.kind);
}

function formatTime(value: number, unitOptions: TimeUnitOptions): string {
  // Create a Duration from the value based on what time unit it is
  const duration: Duration = {};
  switch (unitOptions.kind) {
    case 'Milliseconds':
      duration.seconds = value / 1000;
      break;
    case 'Seconds':
      duration.seconds = value;
      break;
    case 'Minutes':
      duration.minutes = value;
      break;
    case 'Hours':
      duration.hours = value;
      break;
    case 'Days':
      duration.days = value;
      break;
    case 'Weeks':
      duration.weeks = value;
      break;
    case 'Months':
      duration.months = value;
      break;
    case 'Years':
      duration.years = value;
      break;
    default: {
      const exhaustive: never = unitOptions.kind;
      throw new Error(`Unknown time unit type ${exhaustive}`);
    }
  }

  // Find the largest whole time unit we can display the value in and use it
  const ms = milliseconds(duration);
  const seconds = ms / 1000;
  if (seconds < 1) {
    return `${ms.toFixed()} milliseconds`;
  }

  const minutes = seconds / 60;
  if (minutes < 1) {
    return `${seconds.toFixed()} seconds`;
  }

  const hours = minutes / 60;
  if (hours < 1) {
    return `${minutes.toFixed()} minutes`;
  }

  const days = hours / 24;
  if (days < 1) {
    return `${hours.toFixed()} hours`;
  }

  const weeks = days / 7;
  if (weeks < 1) {
    return `${days.toFixed()} days`;
  }

  const years = weeks / 52;
  if (years < 1) {
    return `${weeks.toFixed()} weeks`;
  }

  return `${years.toFixed()} years`;
}

/* Percent Unit Conversion */
const percentUnitKinds = ['Percent', 'PercentDecimal', '%'] as const;
const percentUnitKindsSet = new Set<string>(percentUnitKinds);

type PercentUnitOptions = {
  kind: typeof percentUnitKinds[number];
  decimal_places?: number;
};

function isPercentUnit(unitOptions: UnitOptions): unitOptions is PercentUnitOptions {
  return percentUnitKindsSet.has(unitOptions.kind);
}

function formatPercent(value: number, unitOptions: PercentUnitOptions): string {
  const decimals = unitOptions.decimal_places ?? DEFAULT_DECIMAL_PLACES;

  if (unitOptions.kind === 'PercentDecimal') {
    value = value * 100;
  }

  return value.toFixed(decimals) + '%';
}

/* Decimal Unit Conversion */
const decimalUnitKinds = ['Decimal'] as const;
const decimalUnitKindsSet = new Set<string>(decimalUnitKinds);

type DecimalUnitOptions = {
  kind: typeof decimalUnitKinds[number];
  decimal_places?: number;
  abbreviate?: boolean;
};

function isDecimalUnit(unitOptions: UnitOptions): unitOptions is DecimalUnitOptions {
  return decimalUnitKindsSet.has(unitOptions.kind);
}

function formatDecimal(value: number, unitOptions: DecimalUnitOptions): string {
  const decimals = unitOptions.decimal_places ?? DEFAULT_DECIMAL_PLACES;

  if (unitOptions.abbreviate === true) {
    return abbreviateLargeNumber(value, decimals);
  }

  const formatParams: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: true,
  };
  const decimalFormatter = new Intl.NumberFormat('en-US', formatParams);
  return decimalFormatter.format(value);
}

/**
 * Takes large numbers and abbreviates them with the appropriate suffix
 * 10123 -> 10.123k
 * 1000000 -> 1M
 */
export function abbreviateLargeNumber(num: number, decimals = 2) {
  const modifier = (n: number) => round(n, decimals);
  return formatNumber(num, modifier);
}

/**
 * Takes large numbers, rounds and abbreviates them with the appropriate suffix
 * Add modifier to run on output value prior to unit being added (defaults to rounding)
 */
export function formatNumber(num: number, modifier?: (n: number) => number): string {
  const fn = modifier ?? Math.round;

  return num >= 1e12
    ? fn(num / 1e12) + 'T'
    : num >= 1e9
    ? fn(num / 1e9) + 'B'
    : num >= 1e6
    ? fn(num / 1e6) + 'M'
    : num >= 1e3
    ? fn(num / 1e3) + 'K'
    : num.toString();
}

/* Bytes Unit Conversion */
const bytesUnitKinds = ['Bytes'] as const;
const bytesUnitKindsSet = new Set<string>(bytesUnitKinds);

type BytesUnitOptions = {
  kind: typeof bytesUnitKinds[number];
  decimal_places?: number;
};

function isBytesUnit(unitOptions: UnitOptions): unitOptions is BytesUnitOptions {
  return bytesUnitKindsSet.has(unitOptions.kind);
}

// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript/18650828#18650828
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  // Math.max(0, ...) ensures that we don't return -1 as a value for the index.
  // Why? When the number of bytes are between -1 and 1, Math.floor(Math.log(bytes)/Math.log(1024)) returns -1.
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
