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

const PERCENT_TESTS: UnitTestCase[] = [
  // Percent
  { value: 0, unit: { kind: 'Percent' }, expected: '0%' },
  { value: 0, unit: { kind: 'Percent', decimal_places: 4 }, expected: '0%' },

  { value: 0.001111, unit: { kind: 'Percent' }, expected: '0.00111%' },
  { value: 0.001111, unit: { kind: 'Percent', decimal_places: 0 }, expected: '0%' },
  { value: 0.001111, unit: { kind: 'Percent', decimal_places: 4 }, expected: '0.0011%' },

  { value: 0.011111, unit: { kind: 'Percent' }, expected: '0.0111%' },
  { value: 0.011111, unit: { kind: 'Percent', decimal_places: 0 }, expected: '0%' },
  { value: 0.011111, unit: { kind: 'Percent', decimal_places: 4 }, expected: '0.0111%' },

  { value: 0.111111, unit: { kind: 'Percent' }, expected: '0.111%' },
  { value: 0.111111, unit: { kind: 'Percent', decimal_places: 0 }, expected: '0%' },
  { value: 0.111111, unit: { kind: 'Percent', decimal_places: 4 }, expected: '0.1111%' },

  { value: 1, unit: { kind: 'Percent' }, expected: '1%' },
  { value: 1, unit: { kind: 'Percent', decimal_places: 4 }, expected: '1%' },

  { value: 1.1111, unit: { kind: 'Percent' }, expected: '1.11%' },
  { value: 1.1111, unit: { kind: 'Percent', decimal_places: 0 }, expected: '1%' },
  { value: 1.1111, unit: { kind: 'Percent', decimal_places: 4 }, expected: '1.1111%' },

  { value: 55, unit: { kind: 'Percent' }, expected: '55%' },
  { value: 55, unit: { kind: 'Percent', decimal_places: 4 }, expected: '55%' },

  { value: 55.555, unit: { kind: 'Percent' }, expected: '55.6%' },
  { value: 55.555, unit: { kind: 'Percent', decimal_places: 0 }, expected: '56%' },
  { value: 55.555, unit: { kind: 'Percent', decimal_places: 4 }, expected: '55.555%' },

  { value: 111, unit: { kind: 'Percent' }, expected: '111%' },
  { value: 111, unit: { kind: 'Percent', decimal_places: 4 }, expected: '111%' },

  { value: 111.111, unit: { kind: 'Percent' }, expected: '111%' },
  { value: 111.111, unit: { kind: 'Percent', decimal_places: 0 }, expected: '111%' },
  { value: 111.111, unit: { kind: 'Percent', decimal_places: 4 }, expected: '111.111%' },

  { value: 100000, unit: { kind: 'Percent' }, expected: '100,000%' },

  // PercentDecimal
  { value: 0, unit: { kind: 'PercentDecimal' }, expected: '0%' },
  { value: 0, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '0%' },

  { value: 0.00001111, unit: { kind: 'PercentDecimal' }, expected: '0.00111%' },
  { value: 0.00001111, unit: { kind: 'PercentDecimal', decimal_places: 0 }, expected: '0%' },
  { value: 0.00001111, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '0.0011%' },

  { value: 0.00011111, unit: { kind: 'PercentDecimal' }, expected: '0.0111%' },
  { value: 0.00011111, unit: { kind: 'PercentDecimal', decimal_places: 0 }, expected: '0%' },
  { value: 0.00011111, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '0.0111%' },

  { value: 0.00111111, unit: { kind: 'PercentDecimal' }, expected: '0.111%' },
  { value: 0.00111111, unit: { kind: 'PercentDecimal', decimal_places: 0 }, expected: '0%' },
  { value: 0.00111111, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '0.1111%' },

  { value: 0.01, unit: { kind: 'PercentDecimal' }, expected: '1%' },
  { value: 0.01, unit: { kind: 'PercentDecimal', decimal_places: 0 }, expected: '1%' },
  { value: 0.01, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '1%' },

  { value: 0.01111, unit: { kind: 'PercentDecimal' }, expected: '1.11%' },
  { value: 0.01111, unit: { kind: 'PercentDecimal', decimal_places: 0 }, expected: '1%' },
  { value: 0.01111, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '1.111%' },

  { value: 0.11, unit: { kind: 'PercentDecimal' }, expected: '11%' },
  { value: 0.11, unit: { kind: 'PercentDecimal', decimal_places: 0 }, expected: '11%' },
  { value: 0.11, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '11%' },

  { value: 0.1111, unit: { kind: 'PercentDecimal' }, expected: '11.1%' },
  { value: 0.1111, unit: { kind: 'PercentDecimal', decimal_places: 0 }, expected: '11%' },
  { value: 0.1111, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '11.11%' },

  { value: 1, unit: { kind: 'PercentDecimal' }, expected: '100%' },
  { value: 1, unit: { kind: 'PercentDecimal', decimal_places: 0 }, expected: '100%' },
  { value: 1, unit: { kind: 'PercentDecimal', decimal_places: 4 }, expected: '100%' },

  { value: 10, unit: { kind: 'PercentDecimal' }, expected: '1,000%' },
];

describe('formatValue', () => {
  it.each(PERCENT_TESTS)('returns $expected when $value formatted as $unit', (args: UnitTestCase) => {
    const { value, unit, expected } = args;
    expect(formatValue(value, unit)).toEqual(expected);
  });
});
