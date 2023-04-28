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

import { UnitGroupConfig, UnitConfig } from './types';
import { limitDecimalPlaces } from './utils';
import { MAX_SIGNIFICANT_DIGITS } from './constants';

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

export function formatBytes(bytes: number, options: BytesUnitOptions) {
  const { abbreviate, decimal_places } = options;

  const showFullNumber = abbreviate === false;
  if (showFullNumber) {
    return formatBytesAsFullNumber(bytes, options);
  }

  if (bytes < 1000) {
    const formatterOptions: Intl.NumberFormatOptions = {
      style: 'unit',
      unit: 'byte',
      unitDisplay: 'long',
      useGrouping: true,
    };

    const hasDecimalPlaces = decimal_places !== undefined && decimal_places !== null;
    if (hasDecimalPlaces) {
      formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimal_places);
    } else {
      formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
    }

    const formatter = Intl.NumberFormat('en-US', formatterOptions);
    return formatter.format(bytes);
  }

  // numbro is able to add units like KB, MB, GB, etc. correctly
  return numbro(bytes).format({
    output: 'byte',
    base: 'decimal',
    spaceSeparated: true,
    mantissa: decimal_places ?? 2,
    trimMantissa: true,
    optionalMantissa: true,
  });
}

function formatBytesAsFullNumber(bytes: number, { decimal_places }: BytesUnitOptions) {
  const hasDecimalPlaces = decimal_places !== undefined && decimal_places !== null;
  const formatter = Intl.NumberFormat('en-US', {
    style: 'unit',
    unit: 'byte',
    unitDisplay: 'long',
    maximumFractionDigits: hasDecimalPlaces ? limitDecimalPlaces(decimal_places) : undefined,
    useGrouping: true,
  });
  return formatter.format(bytes);
}
