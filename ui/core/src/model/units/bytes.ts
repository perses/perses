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

import { MAX_SIGNIFICANT_DIGITS } from './constants';
import { UnitGroupConfig, UnitConfig } from './types';
import { hasDecimalPlaces, limitDecimalPlaces, shouldShortenValues } from './utils';

/**
 * We support both SI (decimal) and IEC (binary) units for bytes:
 * 
 * SI/decimal (unit: 'bytes'):
 * 1 KB = 1000 bytes (1000^1 bytes)
 * 1 MB = 1,000,000 bytes (1000^2 bytes)
 * etc.
 * 
 * IEC/binary (unit: 'bytes-binary'):
 * 1 KiB = 1024 bytes (1024^1 bytes)
 * 1 MiB = 1,048,576 bytes (1024^2 bytes)
 * etc.
 */

const DEFAULT_NUMBRO_MANTISSA = 2;

type BytesUnit = 
  | 'bytes' 
  | 'bytes-binary';

export type BytesFormatOptions = {
  unit?: BytesUnit;
  decimalPlaces?: number;
  shortValues?: boolean;
};
export const BYTES_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Bytes',
  decimalPlaces: true,
  shortValues: true,
};
export const BYTES_UNIT_CONFIG: Readonly<Record<BytesUnit, UnitConfig>> = {
  bytes: {
    group: 'Bytes',
    label: 'Bytes (SI)',
  },
  'bytes-binary': {
    group: 'Bytes',
    label: 'Bytes (IEC)',
  },
};

export function formatBytes(bytes: number, { unit = 'bytes', shortValues, decimalPlaces }: BytesFormatOptions): string {
  const isBinary = unit === 'bytes-binary';
  const threshold = isBinary ? 1024 : 1000;
  
  // If we're showing the entire value, we can use Intl.NumberFormat.
  if (!shouldShortenValues(shortValues) || Math.abs(bytes) < threshold) {
    const formatterOptions: Intl.NumberFormatOptions = {
      style: 'unit',
      unit: 'byte',
      unitDisplay: 'long',
      useGrouping: true,
    };

    if (hasDecimalPlaces(decimalPlaces)) {
      formatterOptions.minimumFractionDigits = limitDecimalPlaces(decimalPlaces);
      formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimalPlaces);
    } else {
      // This can happen if bytes is between -threshold and threshold (1000 for SI, 1024 for IEC)
      if (shouldShortenValues(shortValues)) {
        formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
      }
    }
    const formatter = Intl.NumberFormat('en-US', formatterOptions);
    return formatter.format(bytes);
  }

  // If we're showing the shorten value, we use numbro.
  // numbro is able to add units like KB, MB, GB, etc. correctly.
  return numbro(bytes).format({
    output: 'byte',
    base: isBinary ? 'binary' : 'decimal',
    spaceSeparated: true,
    mantissa: hasDecimalPlaces(decimalPlaces) ? decimalPlaces : DEFAULT_NUMBRO_MANTISSA,
    // trimMantissa trims trailing 0s
    trimMantissa: !hasDecimalPlaces(decimalPlaces),
    // optionalMantissa excludes all the decimal places if they're all zeros
    optionalMantissa: !hasDecimalPlaces(decimalPlaces),
  });
}
