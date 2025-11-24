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

const DECIMAL_TESTS: UnitTestCase[] = [
  {
    value: -4444,
    format: { unit: 'decimal' },
    expected: '-4.44K',
  },
  {
    value: -4444,
    format: { unit: 'decimal', shortValues: false },
    expected: '-4,444',
  },
  {
    value: -4444,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '-4,444.0000',
  },
  {
    value: -4444,
    format: { unit: 'decimal', shortValues: true },
    expected: '-4.44K',
  },
  {
    value: -4444,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '-4.4440K',
  },
  {
    value: -0.123456789,
    format: { unit: 'decimal' },
    expected: '-0.123',
  },
  {
    value: -0.123456789,
    format: { unit: 'decimal', shortValues: false },
    expected: '-0.123',
  },
  {
    value: -0.123456789,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '-0.1235',
  },
  {
    value: -0.123456789,
    format: { unit: 'decimal', shortValues: true },
    expected: '-0.123',
  },
  {
    value: -0.123456789,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '-0.1235',
  },
  { value: 0, format: { unit: 'decimal' }, expected: '0' },
  { value: 1, format: { unit: 'decimal' }, expected: '1' },
  {
    value: 10,
    format: { unit: 'decimal' },
    expected: '10',
  },
  {
    value: 10,
    format: { unit: 'decimal', shortValues: false },
    expected: '10',
  },
  {
    value: 10,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '10.0000',
  },
  {
    value: 10,
    format: { unit: 'decimal', shortValues: true },
    expected: '10',
  },
  {
    value: 10,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '10.0000',
  },
  {
    value: 10.123456,
    format: { unit: 'decimal' },
    expected: '10.1',
  },
  {
    value: 10.123456,
    format: { unit: 'decimal', shortValues: false },
    expected: '10.123',
  },
  {
    value: 10.123456,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '10.1235',
  },
  {
    value: 10.123456,
    format: { unit: 'decimal', shortValues: true },
    expected: '10.1',
  },
  {
    value: 10.123456,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '10.1235',
  },
  {
    value: 1000,
    format: { unit: 'decimal' },
    expected: '1K',
  },
  {
    value: 1000,
    format: { unit: 'decimal', shortValues: false },
    expected: '1,000',
  },
  {
    value: 1000,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '1,000.0000',
  },
  {
    value: 1000,
    format: { unit: 'decimal', shortValues: true },
    expected: '1K',
  },
  {
    value: 1000,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '1.0000K',
  },
  {
    value: 4444,
    format: { unit: 'decimal' },
    expected: '4.44K',
  },
  {
    value: 4444,
    format: { unit: 'decimal', shortValues: false },
    expected: '4,444',
  },
  {
    value: 4444,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '4,444.0000',
  },
  {
    value: 4444,
    format: { unit: 'decimal', shortValues: true },
    expected: '4.44K',
  },
  {
    value: 4444,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '4.4440K',
  },
  {
    value: 100000,
    format: { unit: 'decimal' },
    expected: '100K',
  },
  {
    value: 100000,
    format: { unit: 'decimal', shortValues: false },
    expected: '100,000',
  },
  {
    value: 100000,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '100,000.0000',
  },
  {
    value: 100000,
    format: { unit: 'decimal', shortValues: true },
    expected: '100K',
  },
  {
    value: 100000,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '100.0000K',
  },
  {
    value: 666666,
    format: { unit: 'decimal' },
    expected: '667K',
  },
  {
    value: 666666,
    format: { unit: 'decimal', shortValues: false },
    expected: '666,666',
  },
  {
    value: 666666,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '666,666.0000',
  },
  {
    value: 666666,
    format: { unit: 'decimal', shortValues: true },
    expected: '667K',
  },
  {
    value: 666666,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '666.6660K',
  },
  {
    value: 10000000,
    format: { unit: 'decimal' },
    expected: '10M',
  },
  {
    value: 10000000,
    format: { unit: 'decimal', shortValues: false },
    expected: '10,000,000',
  },
  {
    value: 10000000,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '10,000,000.0000',
  },
  {
    value: 10000000,
    format: { unit: 'decimal', shortValues: true },
    expected: '10M',
  },
  {
    value: 10000000,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '10.0000M',
  },
  {
    value: 88888888,
    format: { unit: 'decimal' },
    expected: '88.9M',
  },
  {
    value: 88888888,
    format: { unit: 'decimal', shortValues: false },
    expected: '88,888,888',
  },
  {
    value: 88888888,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '88,888,888.0000',
  },
  {
    value: 88888888,
    format: { unit: 'decimal', shortValues: true },
    expected: '88.9M',
  },
  {
    value: 88888888,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '88.8889M',
  },
  {
    value: 1000000000,
    format: { unit: 'decimal' },
    expected: '1B',
  },
  {
    value: 1000000000,
    format: { unit: 'decimal', shortValues: false },
    expected: '1,000,000,000',
  },
  {
    value: 1000000000,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '1,000,000,000.0000',
  },
  {
    value: 1000000000,
    format: { unit: 'decimal', shortValues: true },
    expected: '1B',
  },
  {
    value: 1000000000,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '1.0000B',
  },
  {
    value: 1010101010,
    format: { unit: 'decimal' },
    expected: '1.01B',
  },
  {
    value: 1010101010,
    format: { unit: 'decimal', shortValues: false },
    expected: '1,010,101,010',
  },
  {
    value: 1010101010,
    format: { unit: 'decimal', shortValues: false, decimalPlaces: 4 },
    expected: '1,010,101,010.0000',
  },
  {
    value: 1010101010,
    format: { unit: 'decimal', shortValues: true },
    expected: '1.01B',
  },
  {
    value: 1010101010,
    format: { unit: 'decimal', shortValues: true, decimalPlaces: 4 },
    expected: '1.0101B',
  },
  {
    value: 1234,
    format: { shortValues: true },
    expected: '1.23K',
  },
  {
    value: 1234,
    format: { shortValues: false },
    expected: '1,234',
  },
  {
    value: 1234,
    format: { shortValues: true, decimalPlaces: 2 },
    expected: '1.23K',
  },
];

describe('formatValue', () => {
  it.each(DECIMAL_TESTS)('returns $expected when $value formatted as $format', (args: UnitTestCase) => {
    const { value, format: format, expected } = args;
    expect(formatValue(value, format)).toEqual(expected);
  });
});
