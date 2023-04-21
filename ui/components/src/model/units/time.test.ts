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
import { UnitTestCase } from './units.test';

const TIME_TESTS: UnitTestCase[] = [
  {
    value: 8000,
    unit: { kind: 'Milliseconds' },
    expected: '8,000ms',
  },
  {
    value: 8000,
    unit: { kind: 'Seconds' },
    expected: '8,000s',
  },
  {
    value: 300,
    unit: { kind: 'Minutes' },
    expected: '300m',
  },
  {
    value: 300,
    unit: { kind: 'Hours' },
    expected: '300h',
  },
  {
    value: 300,
    unit: { kind: 'Days' },
    expected: '300d',
  },
  {
    value: 300,
    unit: { kind: 'Weeks' },
    expected: '300w',
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

describe('formatValue', () => {
  it.each(TIME_TESTS)('returns $expected when $value formatted as $unit', (args: UnitTestCase) => {
    const { value, unit, expected } = args;
    expect(formatValue(value, unit)).toEqual(expected);
  });
});
