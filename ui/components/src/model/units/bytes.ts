// Copyright 2022 The Perses Authors
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

const bytesUnitKinds = ['Bytes'] as const;
type BytesUnitKind = typeof bytesUnitKinds[number];
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
  Bytes: {
    group: 'Bytes',
    label: 'Bytes',
  },
};

/**
 * Format value as bytes, use abbreviate option for more readable sizes (KB, MB, GB, etc.)
 * https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript/18650828#18650828
 */
export function formatBytes(bytes: number, unitOptions: BytesUnitOptions) {
  if (bytes === 0) return '0 Bytes';

  // default to full 'Bytes' formatting
  const options = unitOptions.abbreviate === undefined ? { ...unitOptions, abbreviate: false } : unitOptions;

  let decimals = options.decimal_places ?? DEFAULT_DECIMAL_PLACES;
  // avoids minimumFractionDigits value is out of range error, possible values are 0 to 20
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumfractiondigits
  if (decimals < 0) {
    decimals = 0;
  } else if (decimals > 20) {
    decimals = 20;
  }

  const formatParams: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  };
  const formatter = new Intl.NumberFormat('en-US', formatParams);

  if (options.abbreviate === false) {
    return `${formatter.format(bytes)} Bytes`;
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  // Math.max(0, ...) ensures that we don't return -1 as a value for the index.
  // Why? When the number of bytes are between -1 and 1, Math.floor(Math.log(bytes)/Math.log(1024)) returns -1.
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
  const abbreviatedValue = bytes / Math.pow(k, i);
  return `${formatter.format(abbreviatedValue)} ${sizes[i]}`;
}
