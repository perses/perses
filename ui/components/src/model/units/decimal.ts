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

import { DEFAULT_DECIMAL_PLACES } from './constants';
import { UnitGroupConfig, UnitConfig } from './types';

const decimalUnitKinds = ['Decimal'] as const;
type DecimalUnitKind = (typeof decimalUnitKinds)[number];
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

export function formatDecimal(value: number, { abbreviate, decimal_places }: DecimalUnitOptions): string {
  decimal_places = decimal_places ?? DEFAULT_DECIMAL_PLACES;

  // Avoids maximumFractionDigits value is out of range error. Possible values are 0 to 20.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumfractiondigits
  if (decimal_places < 0) {
    decimal_places = 0;
  } else if (decimal_places > 20) {
    decimal_places = 20;
  }

  const showFullNumber = abbreviate == false || value < 1000;

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    notation: showFullNumber ? 'standard' : 'compact',
    maximumFractionDigits: decimal_places,
    useGrouping: true,
  });
  return formatter.format(value);
}
