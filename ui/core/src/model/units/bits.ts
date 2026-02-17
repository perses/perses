// Copyright The Perses Authors
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
 * We support both SI (decimal) and IEC (binary) units for bits:
 *
 * SI/decimal (unit: 'decbits'):
 * 1 Kb = 1000 bits (1000^1 bits)
 * 1 Mb = 1,000,000 bits (1000^2 bits)
 * etc.
 *
 * IEC/binary (unit: 'bits'):
 * 1 Kib = 1024 bits (1024^1 bits)
 * 1 Mib = 1,048,576 bits (1024^2 bits)
 * etc.
 */

const DEFAULT_NUMBRO_MANTISSA = 2;

type BitsUnit = 'bits' | 'decbits';

export type BitsFormatOptions = {
  unit?: BitsUnit;
  decimalPlaces?: number;
  shortValues?: boolean;
};

export const BITS_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Bits',
  decimalPlaces: true,
  shortValues: true,
};

export const BITS_UNIT_CONFIG: Readonly<Record<BitsUnit, UnitConfig>> = {
  bits: {
    group: 'Bits',
    label: 'Bits (IEC)',
  },
  decbits: {
    group: 'Bits',
    label: 'Bits (SI)',
  },
};

export function formatBits(bits: number, { unit = 'bits', shortValues, decimalPlaces }: BitsFormatOptions): string {
  const isDecimal = unit === 'decbits';
  const threshold = isDecimal ? 1000 : 1024;

  // If we're showing the entire value, we can use Intl.NumberFormat.
  if (!shouldShortenValues(shortValues) || Math.abs(bits) < threshold) {
    const formatterOptions: Intl.NumberFormatOptions = {
      style: 'decimal',
      useGrouping: true,
    };

    if (hasDecimalPlaces(decimalPlaces)) {
      formatterOptions.minimumFractionDigits = limitDecimalPlaces(decimalPlaces);
      formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimalPlaces);
    } else {
      // This can happen if bits is between -threshold and threshold (1000 for SI, 1024 for IEC)
      if (shouldShortenValues(shortValues)) {
        formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
      }
    }
    const formatter = Intl.NumberFormat('en-US', formatterOptions);
    return formatter.format(bits) + ' bits';
  }

  // If we're showing the shorten value, we use numbro.
  // numbro is able to add units like Kb, Mb, Gb, etc. correctly.
  const formatted = numbro(bits).format({
    output: 'byte', // numbro uses 'byte' output for bit formatting
    base: isDecimal ? 'decimal' : 'binary',
    spaceSeparated: true,
    mantissa: hasDecimalPlaces(decimalPlaces) ? decimalPlaces : DEFAULT_NUMBRO_MANTISSA,
    // trimMantissa trims trailing 0s
    trimMantissa: !hasDecimalPlaces(decimalPlaces),
    // optionalMantissa excludes all the decimal places if they're all zeros
    optionalMantissa: !hasDecimalPlaces(decimalPlaces),
  });

  // Replace byte units with bit units
  return formatted
    .replace(/KB/g, 'Kb')
    .replace(/MB/g, 'Mb')
    .replace(/GB/g, 'Gb')
    .replace(/TB/g, 'Tb')
    .replace(/PB/g, 'Pb')
    .replace(/EB/g, 'Eb')
    .replace(/KiB/g, 'Kib')
    .replace(/MiB/g, 'Mib')
    .replace(/GiB/g, 'Gib')
    .replace(/TiB/g, 'Tib')
    .replace(/PiB/g, 'Pib')
    .replace(/EiB/g, 'Eib');
}
