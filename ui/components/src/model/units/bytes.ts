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

import numbro from 'numbro';

import { DEFAULT_DECIMAL_PLACES } from './constants';
import { UnitGroupConfig, UnitConfig } from './types';

const bytesUnitKinds = ['Bytes'] as const;
type BytesUnitKind = (typeof bytesUnitKinds)[number];
export type BytesUnitOptions = {
  kind: BytesUnitKind;
  decimal_places?: number;
  abbreviate?: boolean;
};
export const BYTES_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Bytes',
  decimal_places: true,
  abbreviate: true,
};
export const BYTES_UNIT_CONFIG: Readonly<Record<BytesUnitKind, UnitConfig>> = {
  // This uses units that are powers of 1000.
  // In other words, 1KB = 1000 bytes.
  Bytes: {
    group: 'Bytes',
    label: 'Bytes',
  },
};

export function formatBytes(bytes: number, { abbreviate, decimal_places }: BytesUnitOptions) {
  if (bytes === 0) return '0 bytes';

  decimal_places = decimal_places ?? DEFAULT_DECIMAL_PLACES;
  // Avoids maximumFractionDigits value is out of range error. Possible values are 0 to 20.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumfractiondigits
  if (decimal_places < 0) {
    decimal_places = 0;
  } else if (decimal_places > 20) {
    decimal_places = 20;
  }

  const showFullNumber = abbreviate == false || bytes < 1000;

  if (showFullNumber) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'unit',
      unit: 'byte',
      unitDisplay: 'long',
      maximumFractionDigits: decimal_places,
      useGrouping: true,
    });
    return formatter.format(bytes);
  }

  return numbro(bytes).format({
    output: 'byte',
    base: 'decimal',
    spaceSeparated: true,
    mantissa: decimal_places,
    trimMantissa: true,
    optionalMantissa: true,
  });
}
