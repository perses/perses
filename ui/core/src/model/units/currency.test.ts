// Copyright 2025 The Perses Authors
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

const CURRENCY_TESTS: UnitTestCase[] = [
  {
    value: 1.23,
    format: { unit: 'eur' },
    expected: '€1.23',
  },
  {
    value: 1.23,
    format: { unit: 'aud' },
    expected: 'A$1.23',
  },
  {
    value: 1000,
    format: { unit: 'gbp' },
    expected: '£1,000',
  },
  {
    value: 100000,
    format: { unit: 'jpy' },
    expected: '¥100,000',
  },
  {
    value: -1.23,
    format: { unit: 'usd' },
    expected: '-$1.23',
  },
];

describe('formatValue', () => {
  it.each(CURRENCY_TESTS)('returns $expected when $value formatted as $format', (args: UnitTestCase) => {
    const { value, format: format, expected } = args;
    expect(formatValue(value, format)).toEqual(expected);
  });
});
