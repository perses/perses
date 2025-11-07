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

import { UnitTestCase } from './types';
import { formatValue } from './units';

const TEMPERATURE_TESTS: UnitTestCase[] = [
  {
    value: 10,
    format: { unit: 'celsius', decimalPlaces: 1 },
    expected: '10.0°C',
  },
  {
    value: -5.678,
    format: { unit: 'celsius', decimalPlaces: 2 },
    expected: '-5.68°C',
  },
  {
    value: 25.5,
    format: { unit: 'fahrenheit', decimalPlaces: 1 },
    expected: '25.5°F',
  },
  {
    value: 0,
    format: { unit: 'fahrenheit', decimalPlaces: 0 },
    expected: '0°F',
  },
];

describe('temperature formatValue', () => {
  it.each(TEMPERATURE_TESTS)('returns $expected when $value formatted as $format', (args: UnitTestCase) => {
    const { value, format: format, expected } = args;
    expect(formatValue(value, format)).toEqual(expected);
  });
});
