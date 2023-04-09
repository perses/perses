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

import { formatValue, UnitOptions } from './units';
import { bytesTests } from './bytes.test';

export interface UnitTestCase {
  value: number;
  unit: UnitOptions;
  expected: string;
}

describe('formatValue', () => {
  const tests: UnitTestCase[] = [
    // Decimal
    {
      value: 10,
      unit: { kind: 'Decimal' },
      expected: '10',
    },
    {
      value: 10,
      unit: { kind: 'Decimal', decimal_places: 0 },
      expected: '10',
    },
    {
      value: 10,
      unit: { kind: 'Decimal', decimal_places: 1 },
      expected: '10',
    },
    {
      value: 10,
      unit: { kind: 'Decimal', decimal_places: 2 },
      expected: '10',
    },
    {
      value: 10,
      unit: { kind: 'Decimal', decimal_places: 3 },
      expected: '10',
    },
    {
      value: 10,
      unit: { kind: 'Decimal', decimal_places: 4 },
      expected: '10',
    },
    {
      value: 10.123456,
      unit: { kind: 'Decimal' },
      // The default for decimal_places is 2. This can be changed if we want.
      expected: '10.12',
    },
    {
      value: 10.123456,
      unit: { kind: 'Decimal', decimal_places: 0 },
      expected: '10',
    },
    {
      value: 10.123456,
      unit: { kind: 'Decimal', decimal_places: 1 },
      expected: '10.1',
    },
    {
      value: 10.123456,
      unit: { kind: 'Decimal', decimal_places: 2 },
      expected: '10.12',
    },
    {
      value: 10.123456,
      unit: { kind: 'Decimal', decimal_places: 3 },
      expected: '10.123',
    },
    {
      value: 10.123456,
      unit: { kind: 'Decimal', decimal_places: 4 },
      expected: '10.1235',
    },
    {
      value: 100000,
      unit: { kind: 'Decimal' },
      expected: '100,000',
    },
    {
      value: 155900,
      unit: { kind: 'Decimal', decimal_places: 4 },
      expected: '155,900',
    },
    {
      value: 1000,
      unit: { kind: 'Decimal', decimal_places: 2, abbreviate: true },
      expected: '1K',
    },
    {
      value: 1590.878787,
      unit: { kind: 'Decimal', decimal_places: 3, abbreviate: true },
      expected: '1.591K',
    },
    {
      value: 0.123456789,
      unit: { kind: 'Decimal', decimal_places: 2, abbreviate: true },
      expected: '0.12',
    },
    {
      value: 0.123456789,
      unit: { kind: 'Decimal', decimal_places: 4, abbreviate: false },
      expected: '0.1235',
    },
    {
      value: -0.123456789,
      unit: { kind: 'Decimal', decimal_places: 3, abbreviate: true },
      expected: '-0.123',
    },
    {
      value: 0,
      unit: { kind: 'Decimal', decimal_places: 2, abbreviate: true },
      expected: '0',
    },
    // Percent
    {
      value: 10,
      unit: { kind: 'Percent' },
      expected: '10.00%',
    },
    {
      value: 50,
      unit: { kind: 'Percent', decimal_places: 0 },
      expected: '50%',
    },
    {
      value: 0.1,
      unit: { kind: 'PercentDecimal' },
      expected: '10.00%',
    },
    // Time
    {
      value: 8000,
      unit: { kind: 'Milliseconds' },
      expected: '8,000 milliseconds',
    },
    {
      value: 200900,
      unit: { kind: 'Seconds' },
      expected: '200,900 seconds',
    },
    {
      value: 300,
      unit: { kind: 'Minutes' },
      expected: '300 minutes',
    },
    {
      value: 300,
      unit: { kind: 'Hours' },
      expected: '300 hours',
    },
    {
      value: 300,
      unit: { kind: 'Days' },
      expected: '300 days',
    },
    {
      value: 300,
      unit: { kind: 'Weeks' },
      expected: '300 weeks',
    },
    {
      value: 300,
      unit: { kind: 'Months' },
      expected: '300 months',
    },
    {
      value: 300,
      unit: { kind: 'Years' },
      expected: '300 years',
    },
  ];
  it.each([...tests, ...bytesTests])('returns $expected when $value formatted as $unit', (args: UnitTestCase) => {
    const { value, unit, expected } = args;
    expect(formatValue(value, unit)).toEqual(expected);
  });
});
