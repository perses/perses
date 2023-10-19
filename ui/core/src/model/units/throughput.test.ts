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

import { formatValue } from './units';
import { UnitTestCase } from './types';

const THROUGHPUT_TESTS: UnitTestCase[] = [
  {
    value: -4444,
    format: { unit: 'counts/sec' },
    expected: '-4.44K counts/sec',
  },
  {
    value: -4444,
    format: { unit: 'ops/sec', shortValues: false },
    expected: '-4,444 ops/sec',
  },
  {
    value: -4444,
    format: { unit: 'requests/sec', shortValues: false, decimalPlaces: 4 },
    expected: '-4,444.0000 requests/sec',
  },
  {
    value: -4444,
    format: { unit: 'reads/sec', shortValues: true },
    expected: '-4.44K reads/sec',
  },
  {
    value: -4444,
    format: { unit: 'writes/sec', shortValues: true, decimalPlaces: 4 },
    expected: '-4.4440K writes/sec',
  },
  {
    value: -0.123456789,
    format: { unit: 'events/sec' },
    expected: '-0.123 events/sec',
  },
  {
    value: -0.123456789,
    format: { unit: 'messages/sec', shortValues: false },
    expected: '-0.123 messages/sec',
  },
  {
    value: -0.123456789,
    format: { unit: 'records/sec', shortValues: false, decimalPlaces: 4 },
    expected: '-0.1235 records/sec',
  },
  {
    value: -0.123456789,
    format: { unit: 'rows/sec', shortValues: true },
    expected: '-0.123 rows/sec',
  },
  { value: 0, format: { unit: 'counts/sec' }, expected: '0 counts/sec' },
  { value: 1, format: { unit: 'ops/sec' }, expected: '1 ops/sec' },
];

describe('formatValue', () => {
  it.each(THROUGHPUT_TESTS)('returns $expected when $value formatted as $format', (args: UnitTestCase) => {
    const { value, format: format, expected } = args;
    expect(formatValue(value, format)).toEqual(expected);
  });
});
