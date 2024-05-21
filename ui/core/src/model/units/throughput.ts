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

import { formatBytes } from './bytes';
import { MAX_SIGNIFICANT_DIGITS } from './constants';
import { UnitGroupConfig, UnitConfig } from './types';
import { hasDecimalPlaces, limitDecimalPlaces, shouldShortenValues } from './utils';

const throughputUnits = [
  'bytes/sec',
  'counts/sec',
  'events/sec',
  'messages/sec',
  'ops/sec',
  'packets/sec',
  'reads/sec',
  'records/sec',
  'requests/sec',
  'rows/sec',
  'writes/sec',
] as const;
type ThroughputUnit = (typeof throughputUnits)[number];
export type ThroughputFormatOptions = {
  unit: ThroughputUnit;
  decimalPlaces?: number;
  shortValues?: boolean;
};
export const THROUGHPUT_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Throughput',
  decimalPlaces: true,
};
const THROUGHPUT_GROUP = 'Throughput';
export const THROUGHPUT_UNIT_CONFIG: Readonly<Record<ThroughputUnit, UnitConfig>> = {
  'bytes/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Bytes/sec',
  },
  'counts/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Counts/sec',
  },
  'events/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Events/sec',
  },
  'messages/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Messages/sec',
  },
  'ops/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Ops/sec',
  },
  'packets/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Packets/sec',
  },
  'reads/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Reads/sec',
  },
  'requests/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Requests/sec',
  },
  'records/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Records/sec',
  },
  'rows/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Rows/sec',
  },
  'writes/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Writes/sec',
  },
};

export function formatThroughput(value: number, { unit, shortValues, decimalPlaces }: ThroughputFormatOptions): string {
  // special case for data throughput
  if (unit == 'bytes/sec') {
    const denominator = Math.abs(value) < 1000 ? 'sec' : 's';
    return formatBytes(value, { unit: 'bytes', shortValues, decimalPlaces }) + '/' + denominator;
  }

  const formatterOptions: Intl.NumberFormatOptions = {
    style: 'decimal',
    useGrouping: true,
  };

  if (shouldShortenValues(shortValues)) {
    formatterOptions.notation = 'compact';
  }

  if (hasDecimalPlaces(decimalPlaces)) {
    formatterOptions.minimumFractionDigits = limitDecimalPlaces(decimalPlaces);
    formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimalPlaces);
  } else {
    if (shouldShortenValues(shortValues)) {
      formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
    }
  }

  const formatter = Intl.NumberFormat('en-US', formatterOptions);
  return formatter.format(value) + ' ' + unit;
}
