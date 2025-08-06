// Copyright 2025 The Perses Authors
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

import { toUpper } from 'lodash';
import { MAX_SIGNIFICANT_DIGITS } from './constants';
import { UnitConfig, UnitGroupConfig } from './types';
import { hasDecimalPlaces, limitDecimalPlaces } from './utils';

// See Intl.supportedValuesOf("currency") for valid options, key names will
// be converted to uppercase to match the expectation of Intl.NumberFormat
type CurrencyUnits =
  | 'aud'
  | 'cad'
  | 'chf'
  | 'cny'
  | 'eur'
  | 'gbp'
  | 'hkd'
  | 'inr'
  | 'jpy'
  | 'krw'
  | 'nok'
  | 'nzd'
  | 'sek'
  | 'sgd'
  | 'usd';
export type CurrencyFormatOptions = {
  unit: CurrencyUnits;
  decimalPlaces?: number;
};

const CURRENCY_GROUP = 'Currency';
export const CURRENCY_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Currency',
  decimalPlaces: true,
};
export const CURRENCY_UNIT_CONFIG: Readonly<Record<CurrencyUnits, UnitConfig>> = {
  aud: {
    group: CURRENCY_GROUP,
    label: 'Australian Dollar (A$)',
  },
  cad: {
    group: CURRENCY_GROUP,
    label: 'Canadian Dollar (CA$)',
  },
  chf: {
    group: CURRENCY_GROUP,
    label: 'Swiss Franc (CHF)',
  },
  cny: {
    group: CURRENCY_GROUP,
    label: 'Renminbi (CN¥)',
  },
  eur: {
    group: CURRENCY_GROUP,
    label: 'Euro (€)',
  },
  gbp: {
    group: CURRENCY_GROUP,
    label: 'Pound (£)',
  },
  hkd: {
    group: CURRENCY_GROUP,
    label: 'Hong Kong Dollar (HK$)',
  },
  inr: {
    group: CURRENCY_GROUP,
    label: 'Indian Rupee (₹)',
  },
  jpy: {
    group: CURRENCY_GROUP,
    label: 'Yen (¥)',
  },
  krw: {
    group: CURRENCY_GROUP,
    label: 'South Korean Won (₩)',
  },
  nok: {
    group: CURRENCY_GROUP,
    label: 'Norwegian Krone (NOK)',
  },
  nzd: {
    group: CURRENCY_GROUP,
    label: 'New Zealand Dollar (NZ$)',
  },
  sek: {
    group: CURRENCY_GROUP,
    label: 'Swedish Krona (SEK)',
  },
  sgd: {
    group: CURRENCY_GROUP,
    label: 'Singapore Dollar (S$)',
  },
  usd: {
    group: CURRENCY_GROUP,
    label: 'US Dollar ($)',
  },
};

export function formatCurrency(value: number, { unit, decimalPlaces }: CurrencyFormatOptions): string {
  const formatterOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: toUpper(unit),
    currencyDisplay: 'symbol',
  };

  if (hasDecimalPlaces(decimalPlaces)) {
    formatterOptions.minimumFractionDigits = limitDecimalPlaces(decimalPlaces);
    formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimalPlaces);
  } else {
    formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
  }

  const formatter = Intl.NumberFormat('en-US', formatterOptions);
  return formatter.format(value);
}
