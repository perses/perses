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

import { MAX_SIGNIFICANT_DIGITS } from './constants';
import { UnitConfig, UnitGroupConfig } from './types';
import { hasDecimalPlaces, limitDecimalPlaces } from './utils';

const TEMPERATURE_GROUP = 'Temperature';

type TemperatureUnits = 'celsius' | 'fahrenheit';

export type TemperatureFormatOptions = {
  unit: TemperatureUnits;
  decimalPlaces?: number;
};

export const TEMPERATURE_GROUP_CONFIG: UnitGroupConfig = {
  label: TEMPERATURE_GROUP,
  decimalPlaces: true,
};

export const TEMPERATURE_UNIT_CONFIG: Readonly<Record<TemperatureUnits, UnitConfig>> = {
  celsius: {
    group: TEMPERATURE_GROUP,
    label: 'Celsius (°C)',
  },
  fahrenheit: {
    group: TEMPERATURE_GROUP,
    label: 'Fahrenheit (°F)',
  },
};

export const formatTemperature = (value: number, { unit, decimalPlaces }: TemperatureFormatOptions): string => {
  const formatterOptions: Intl.NumberFormatOptions = {
    unit,
    style: 'unit',
  };

  if (hasDecimalPlaces(decimalPlaces)) {
    formatterOptions.minimumFractionDigits = limitDecimalPlaces(decimalPlaces);
    formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimalPlaces);
  } else {
    formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
  }

  const locals = unit === 'celsius' ? 'en-GB' : 'en-US';
  return Intl.NumberFormat(locals, formatterOptions).format(value);
};
