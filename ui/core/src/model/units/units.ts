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

import { formatBytes, BytesUnitOptions, BYTES_GROUP_CONFIG, BYTES_UNIT_CONFIG } from './bytes';
import { formatDecimal, DecimalUnitOptions, DECIMAL_GROUP_CONFIG, DECIMAL_UNIT_CONFIG } from './decimal';
import { formatPercent, PercentUnitOptions, PERCENT_GROUP_CONFIG, PERCENT_UNIT_CONFIG } from './percent';
import { formatTime, TimeUnitOptions, TIME_GROUP_CONFIG, TIME_UNIT_CONFIG } from './time';
import { UnitGroup, UnitGroupConfig, UnitConfig } from './types';

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
};
export const UNIT_CONFIG = {
  ...TIME_UNIT_CONFIG,
  ...PERCENT_UNIT_CONFIG,
  ...DECIMAL_UNIT_CONFIG,
  ...BYTES_UNIT_CONFIG,
} as const;

export type UnitOptions = TimeUnitOptions | PercentUnitOptions | DecimalUnitOptions | BytesUnitOptions;

type HasDecimalPlaces<UnitOpt> = UnitOpt extends { decimal_places?: number } ? UnitOpt : never;
type HasAbbreviate<UnitOpt> = UnitOpt extends { abbreviate?: boolean } ? UnitOpt : never;

export function formatValue(value: number, unitOptions?: UnitOptions): string {
  if (unitOptions === undefined) {
    return value.toString();
  }

  if (isBytesUnit(unitOptions)) {
    return formatBytes(value, unitOptions);
  }

  if (isDecimalUnit(unitOptions)) {
    return formatDecimal(value, unitOptions);
  }

  if (isPercentUnit(unitOptions)) {
    return formatPercent(value, unitOptions);
  }

  if (isTimeUnit(unitOptions)) {
    return formatTime(value, unitOptions);
  }

  const exhaustive: never = unitOptions;
  throw new Error(`Unknown unit options ${exhaustive}`);
}

export function getUnitKindConfig(unitOptions: UnitOptions): UnitConfig {
  return UNIT_CONFIG[unitOptions.kind];
}

export function getUnitGroup(unitOptions: UnitOptions): UnitGroup {
  return getUnitKindConfig(unitOptions).group;
}

export function getUnitGroupConfig(unitOptions: UnitOptions): UnitGroupConfig {
  const unitConfig = getUnitKindConfig(unitOptions);
  return UNIT_GROUP_CONFIG[unitConfig.group];
}

// Type guards
export function isTimeUnit(unitOptions: UnitOptions): unitOptions is TimeUnitOptions {
  return getUnitGroup(unitOptions) === 'Time';
}

export function isPercentUnit(unitOptions: UnitOptions): unitOptions is PercentUnitOptions {
  return getUnitGroup(unitOptions) === 'Percent';
}

export function isDecimalUnit(unitOptions: UnitOptions): unitOptions is DecimalUnitOptions {
  return getUnitGroup(unitOptions) === 'Decimal';
}

export function isBytesUnit(unitOptions: UnitOptions): unitOptions is BytesUnitOptions {
  return getUnitGroup(unitOptions) === 'Bytes';
}

export function isUnitWithDecimalPlaces(unitOptions: UnitOptions): unitOptions is HasDecimalPlaces<UnitOptions> {
  const groupConfig = getUnitGroupConfig(unitOptions);

  return !!groupConfig.decimal_places;
}

export function isUnitWithAbbreviate(unitOptions: UnitOptions): unitOptions is HasAbbreviate<UnitOptions> {
  const groupConfig = getUnitGroupConfig(unitOptions);

  return !!groupConfig.abbreviate;
}
