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

const TIME_TESTS: UnitTestCase[] = [
  {
    value: 0,
    unit: { kind: 'Milliseconds' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Seconds' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Minutes' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Hours' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Days' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Weeks' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Months' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Years' },
    expected: '0s',
  },
  {
    value: 0.001,
    unit: { kind: 'Milliseconds' },
    expected: '0.001ms',
  },
  {
    value: 0.001,
    unit: { kind: 'Seconds' },
    expected: '1ms',
  },
  {
    value: 0.001,
    unit: { kind: 'Minutes' },
    expected: '60ms',
  },
  {
    value: 0.001,
    unit: { kind: 'Hours' },
    expected: '3.6s',
  },
  {
    value: 0.001,
    unit: { kind: 'Days' },
    expected: '1.44m',
  },
  {
    value: 0.001,
    unit: { kind: 'Weeks' },
    expected: '10.1m',
  },
  {
    value: 0.001,
    unit: { kind: 'Months' },
    expected: '43.2m',
  },
  {
    value: 0.001,
    unit: { kind: 'Years' },
    expected: '8.76h',
  },
  {
    value: 1,
    unit: { kind: 'Milliseconds' },
    expected: '1ms',
  },
  {
    value: 1,
    unit: { kind: 'Seconds' },
    expected: '1s',
  },
  {
    value: 1,
    unit: { kind: 'Minutes' },
    expected: '1m',
  },
  {
    value: 1,
    unit: { kind: 'Hours' },
    expected: '1h',
  },
  {
    value: 1,
    unit: { kind: 'Days' },
    expected: '1d',
  },
  {
    value: 1,
    unit: { kind: 'Weeks' },
    expected: '1w',
  },
  {
    value: 1,
    unit: { kind: 'Months' },
    expected: '1 month',
  },
  {
    value: 1,
    unit: { kind: 'Years' },
    expected: '1 year',
  },
  {
    value: 100,
    unit: { kind: 'Milliseconds' },
    expected: '100ms',
  },
  {
    value: 100,
    unit: { kind: 'Seconds' },
    expected: '1.67m',
  },
  {
    value: 100,
    unit: { kind: 'Minutes' },
    expected: '1.67h',
  },
  {
    value: 100,
    unit: { kind: 'Hours' },
    expected: '4.17d',
  },
  {
    value: 100,
    unit: { kind: 'Days' },
    expected: '3.33 months',
  },
  {
    value: 100,
    unit: { kind: 'Weeks' },
    expected: '1.92 years',
  },
  {
    value: 100,
    unit: { kind: 'Months' },
    expected: '8.22 years',
  },
  {
    value: 100,
    unit: { kind: 'Years' },
    expected: '100 years',
  },
];

describe('formatValue', () => {
  it.each(TIME_TESTS)('returns $expected when $value formatted as $unit', (args: UnitTestCase) => {
    const { value, unit, expected } = args;
    expect(formatValue(value, unit)).toEqual(expected);
  });
});
