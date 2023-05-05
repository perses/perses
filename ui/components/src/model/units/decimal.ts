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
import { hasDecimalPlaces, limitDecimalPlaces, shouldAbbreviate } from './utils';

const decimalUnitKinds = ['Decimal'] as const;
type DecimalUnitKind = (typeof decimalUnitKinds)[number];
export type DecimalUnitOptions = {
  kind: DecimalUnitKind;
  decimal_places?: number;
  abbreviate?: boolean;
};
export const DECIMAL_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Decimal',
  decimal_places: true,
  abbreviate: true,
};
export const DECIMAL_UNIT_CONFIG: Readonly<Record<DecimalUnitKind, UnitConfig>> = {
  Decimal: {
    group: 'Decimal',
    label: 'Decimal',
  },
};

export function formatDecimal(value: number, options: DecimalUnitOptions): string {
  const { abbreviate, decimal_places } = options;

  const formatterOptions: Intl.NumberFormatOptions = {
    style: 'decimal',
    useGrouping: true,
  };

  if (shouldAbbreviate(abbreviate)) {
    formatterOptions.notation = 'compact';
  }

  if (hasDecimalPlaces(decimal_places)) {
    formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimal_places);
  } else {
    if (shouldAbbreviate(abbreviate)) {
      formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
    }
  }

  const formatter = Intl.NumberFormat('en-US', formatterOptions);
  return formatter.format(value);
}
