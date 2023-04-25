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

export interface UnitTestCase {
  value: number;
  unit: UnitOptions;
  expected: string;
}

// TODO: Create test files for time units. Write more tests for time units.
describe('formatValue', () => {
  const tests: UnitTestCase[] = [
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
  it.each(tests)('returns $expected when $value formatted as $unit', (args: UnitTestCase) => {
    const { value, unit, expected } = args;
    expect(formatValue(value, unit)).toEqual(expected);
  });
});
