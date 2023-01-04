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

import { UnitGroupConfig, UnitConfig } from './types';
import { DEFAULT_DECIMAL_PLACES } from './constants';

const percentUnitKinds = ['Percent', 'PercentDecimal', '%'] as const;
type PercentUnitKind = typeof percentUnitKinds[number];
export type PercentUnitOptions = {
  kind: PercentUnitKind;
  decimal_places?: number;
};
export const DECIMAL_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Decimal',
  decimal_places: true,
  abbreviate: true,
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

export function formatPercent(value: number, unitOptions: PercentUnitOptions): string {
  const decimals = unitOptions.decimal_places ?? DEFAULT_DECIMAL_PLACES;

  if (unitOptions.kind === 'PercentDecimal') {
    value = value * 100;
  }

  return value.toFixed(decimals) + '%';
}
