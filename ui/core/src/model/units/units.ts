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

import { formatBytes, BytesFormatOptions as BytesFormatOptions, BYTES_GROUP_CONFIG, BYTES_UNIT_CONFIG } from './bytes';
import {
  formatDecimal,
  DecimalFormatOptions as DecimalFormatOptions,
  DECIMAL_GROUP_CONFIG,
  DECIMAL_UNIT_CONFIG,
} from './decimal';
import {
  formatPercent,
  PercentFormatOptions as PercentFormatOptions,
  PERCENT_GROUP_CONFIG,
  PERCENT_UNIT_CONFIG,
} from './percent';
import { formatTime, TimeFormatOptions as TimeFormatOptions, TIME_GROUP_CONFIG, TIME_UNIT_CONFIG } from './time';
import { UnitGroup, UnitGroupConfig, UnitConfig } from './types';
import {
  formatThroughput,
  THROUGHPUT_GROUP_CONFIG,
  THROUGHPUT_UNIT_CONFIG,
  ThroughputFormatOptions,
} from './throughput';

/**
 * Most of the number formatting is based on Intl.NumberFormat, which is built into JavaScript.
 * Prefer Intl.NumbeFormat because it covers most use cases and will continue to be supported with time.
 *
 * To format bytes, we also make use of the `numbro` package,
 * because it can handle adding units like KB, MB, GB, etc. correctly.
 */

export const UNIT_GROUP_CONFIG: Readonly<Record<UnitGroup, UnitGroupConfig>> = {
  Time: TIME_GROUP_CONFIG,
  Percent: PERCENT_GROUP_CONFIG,
  Decimal: DECIMAL_GROUP_CONFIG,
  Bytes: BYTES_GROUP_CONFIG,
  Throughput: THROUGHPUT_GROUP_CONFIG,
};
export const UNIT_CONFIG = {
  ...TIME_UNIT_CONFIG,
  ...PERCENT_UNIT_CONFIG,
  ...DECIMAL_UNIT_CONFIG,
  ...BYTES_UNIT_CONFIG,
  ...THROUGHPUT_UNIT_CONFIG,
} as const;

export type FormatOptions =
  | TimeFormatOptions
  | PercentFormatOptions
  | DecimalFormatOptions
  | BytesFormatOptions
  | ThroughputFormatOptions;

type HasDecimalPlaces<UnitOpt> = UnitOpt extends { decimalPlaces?: number } ? UnitOpt : never;
type HasShortValues<UnitOpt> = UnitOpt extends { shortValues?: boolean } ? UnitOpt : never;

export function formatValue(value: number, formatOptions?: FormatOptions): string {
  if (formatOptions === undefined) {
    return value.toString();
  }

  if (isBytesUnit(formatOptions)) {
    return formatBytes(value, formatOptions);
  }

  if (isDecimalUnit(formatOptions)) {
    return formatDecimal(value, formatOptions);
  }

  if (isPercentUnit(formatOptions)) {
    return formatPercent(value, formatOptions);
  }

  if (isTimeUnit(formatOptions)) {
    return formatTime(value, formatOptions);
  }

  if (isThroughputUnit(formatOptions)) {
    return formatThroughput(value, formatOptions);
  }

  const exhaustive: never = formatOptions;
  throw new Error(`Unknown unit options ${exhaustive}`);
}

export function getUnitConfig(formatOptions: FormatOptions): UnitConfig {
  const unit = formatOptions.unit ?? 'decimal';
  return UNIT_CONFIG[unit];
}

export function getUnitGroup(formatOptions: FormatOptions): UnitGroup {
  return getUnitConfig(formatOptions).group ?? 'Decimal';
}

export function getUnitGroupConfig(formatOptions: FormatOptions): UnitGroupConfig {
  const unitConfig = getUnitConfig(formatOptions);
  return UNIT_GROUP_CONFIG[unitConfig.group ?? 'Decimal'];
}

// Type guards
export function isTimeUnit(formatOptions: FormatOptions): formatOptions is TimeFormatOptions {
  return getUnitGroup(formatOptions) === 'Time';
}

export function isPercentUnit(formatOptions: FormatOptions): formatOptions is PercentFormatOptions {
  return getUnitGroup(formatOptions) === 'Percent';
}

export function isDecimalUnit(formatOptions: FormatOptions): formatOptions is DecimalFormatOptions {
  return getUnitGroup(formatOptions) === 'Decimal';
}

export function isBytesUnit(formatOptions: FormatOptions): formatOptions is BytesFormatOptions {
  return getUnitGroup(formatOptions) === 'Bytes';
}

export function isUnitWithDecimalPlaces(
  formatOptions: FormatOptions
): formatOptions is HasDecimalPlaces<FormatOptions> {
  const groupConfig = getUnitGroupConfig(formatOptions);

  return !!groupConfig.decimalPlaces;
}

export function isUnitWithShortValues(formatOptions: FormatOptions): formatOptions is HasShortValues<FormatOptions> {
  const groupConfig = getUnitGroupConfig(formatOptions);

  return !!groupConfig.shortValues;
}

export function isThroughputUnit(formatOptions: FormatOptions): formatOptions is ThroughputFormatOptions {
  return getUnitGroup(formatOptions) === 'Throughput';
}
