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

interface UnitTestCase {
  value: number;
  unit: UnitOptions;
  expected: string;
}

describe('formatValue', () => {
  const tests: UnitTestCase[] = [
    {
      value: 100000,
      unit: { kind: 'Decimal' },
      expected: '100,000.00',
    },
    {
      value: 155900,
      unit: { kind: 'Decimal', decimal_places: 4 },
      expected: '155,900.0000',
    },
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
    {
      value: 100,
      unit: { kind: 'Bytes', decimal_places: 0, abbreviate: false },
      expected: '100 bytes',
    },
    {
      value: 100,
      unit: { kind: 'Bytes', decimal_places: -1, abbreviate: false },
      expected: '100 bytes',
    },
    {
      value: 225000,
      unit: { kind: 'Bytes', decimal_places: 0, abbreviate: true },
      expected: '220 KB',
    },
    {
      value: 505200,
      unit: { kind: 'Bytes' },
      expected: '505,200.00 bytes',
    },
    {
      value: 8000,
      unit: { kind: 'Milliseconds' },
      expected: '8,000.00 milliseconds',
    },
    {
      value: 200900,
      unit: { kind: 'Seconds' },
      expected: '200,900.00 seconds',
    },
    {
      value: 300,
      unit: { kind: 'Minutes' },
      expected: '300.00 minutes',
    },
    {
      value: 300,
      unit: { kind: 'Hours' },
      expected: '300.00 hours',
    },
    {
      value: 300,
      unit: { kind: 'Days' },
      expected: '300.00 days',
    },
    {
      value: 300,
      unit: { kind: 'Weeks' },
      expected: '300.00 weeks',
    },
    {
      value: 300,
      unit: { kind: 'Months' },
      expected: '300.00 months',
    },
    {
      value: 300,
      unit: { kind: 'Years' },
      expected: '300.00 years',
    },
  ];
  it.each(tests)('returns $expected when $value formatted as $unit', (args: UnitTestCase) => {
    const { value, unit, expected } = args;
    expect(formatValue(value, unit)).toEqual(expected);
  });
});
