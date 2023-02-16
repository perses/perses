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

import { round } from '../../utils/mathjs';
import { DEFAULT_DECIMAL_PLACES } from './constants';
import { UnitGroupConfig, UnitConfig } from './types';

const decimalUnitKinds = ['Decimal'] as const;
type DecimalUnitKind = typeof decimalUnitKinds[number];
export type DecimalUnitOptions = {
  kind: DecimalUnitKind;
  decimal_places?: number;
  abbreviate?: boolean;
};
export const PERCENT_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Percent',
  decimal_places: true,
};
export const DECIMAL_UNIT_CONFIG: Readonly<Record<DecimalUnitKind, UnitConfig>> = {
  Decimal: {
    group: 'Decimal',
    label: 'Decimal',
  },
};

export function formatDecimal(value: number, unitOptions: DecimalUnitOptions): string {
  const decimals = unitOptions.decimal_places ?? DEFAULT_DECIMAL_PLACES;

  if (value === 0) {
    return value.toString();
  }

  if (unitOptions.abbreviate && value >= 1000) {
    return abbreviateLargeNumber(value, decimals);
  }

  const formatParams: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: decimals,
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
