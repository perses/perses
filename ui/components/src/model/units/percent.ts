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

const percentUnitKinds = ['Percent', 'PercentDecimal', '%'] as const;
type PercentUnitKind = (typeof percentUnitKinds)[number];
export type PercentUnitOptions = {
  kind: PercentUnitKind;
  decimal_places?: number;
};
export const PERCENT_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Percent',
  decimal_places: true,
};
const PERCENT_GROUP = 'Percent';
export const PERCENT_UNIT_CONFIG: Readonly<Record<PercentUnitKind, UnitConfig>> = {
  Percent: {
    group: PERCENT_GROUP,
    label: 'Percent (0-100)',
  },
  PercentDecimal: {
    group: PERCENT_GROUP,
    label: 'Percent (0.0-1.0)',
  },
  '%': {
    // This option is not shown in the selector because it is a shorthand
    // duplicate of `Percent`.
    disableSelectorOption: true,
    group: PERCENT_GROUP,
    label: '%',
  },
};

export function formatPercent(value: number, { kind, decimal_places }: PercentUnitOptions): string {
  // Intl.NumberFormat translates 0 -> 0%, 0.5 -> 50%, 1 -> 100%
  if (kind === 'Percent') {
    value = value / 100;
  }

  const formatterOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    useGrouping: true,
  };

  if (hasDecimalPlaces(decimal_places)) {
    formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimal_places);
  } else {
    formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
  }

  const formatter = Intl.NumberFormat('en-us', formatterOptions);
  return formatter.format(value);
}
