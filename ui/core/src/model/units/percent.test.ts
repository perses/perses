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
  // percent
  { value: 0, format: { unit: 'percent' }, expected: '0%' },
  { value: 0, format: { unit: 'percent', decimalPlaces: 4 }, expected: '0.0000%' },

  { value: 0.001111, format: { unit: 'percent' }, expected: '0.00111%' },
  { value: 0.001111, format: { unit: 'percent', decimalPlaces: 0 }, expected: '0%' },
  { value: 0.001111, format: { unit: 'percent', decimalPlaces: 4 }, expected: '0.0011%' },

  { value: 0.011111, format: { unit: 'percent' }, expected: '0.0111%' },
  { value: 0.011111, format: { unit: 'percent', decimalPlaces: 0 }, expected: '0%' },
  { value: 0.011111, format: { unit: 'percent', decimalPlaces: 4 }, expected: '0.0111%' },

  { value: 0.111111, format: { unit: 'percent' }, expected: '0.111%' },
  { value: 0.111111, format: { unit: 'percent', decimalPlaces: 0 }, expected: '0%' },
  { value: 0.111111, format: { unit: 'percent', decimalPlaces: 4 }, expected: '0.1111%' },

  { value: 1, format: { unit: 'percent' }, expected: '1%' },
  { value: 1, format: { unit: 'percent', decimalPlaces: 4 }, expected: '1.0000%' },

  { value: 1.1111, format: { unit: 'percent' }, expected: '1.11%' },
  { value: 1.1111, format: { unit: 'percent', decimalPlaces: 0 }, expected: '1%' },
  { value: 1.1111, format: { unit: 'percent', decimalPlaces: 4 }, expected: '1.1111%' },

  { value: 55, format: { unit: 'percent' }, expected: '55%' },
  { value: 55, format: { unit: 'percent', decimalPlaces: 4 }, expected: '55.0000%' },

  { value: 55.555, format: { unit: 'percent' }, expected: '55.6%' },
  { value: 55.555, format: { unit: 'percent', decimalPlaces: 0 }, expected: '56%' },
  { value: 55.555, format: { unit: 'percent', decimalPlaces: 4 }, expected: '55.5550%' },

  { value: 111, format: { unit: 'percent' }, expected: '111%' },
  { value: 111, format: { unit: 'percent', decimalPlaces: 4 }, expected: '111.0000%' },

  { value: 111.111, format: { unit: 'percent' }, expected: '111%' },
  { value: 111.111, format: { unit: 'percent', decimalPlaces: 0 }, expected: '111%' },
  { value: 111.111, format: { unit: 'percent', decimalPlaces: 4 }, expected: '111.1110%' },

  { value: 100000, format: { unit: 'percent' }, expected: '100,000%' },

  // percent-decimal
  { value: 0, format: { unit: 'percent-decimal' }, expected: '0%' },
  { value: 0, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '0.0000%' },

  { value: 0.00001111, format: { unit: 'percent-decimal' }, expected: '0.00111%' },
  { value: 0.00001111, format: { unit: 'percent-decimal', decimalPlaces: 0 }, expected: '0%' },
  { value: 0.00001111, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '0.0011%' },

  { value: 0.00011111, format: { unit: 'percent-decimal' }, expected: '0.0111%' },
  { value: 0.00011111, format: { unit: 'percent-decimal', decimalPlaces: 0 }, expected: '0%' },
  { value: 0.00011111, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '0.0111%' },

  { value: 0.00111111, format: { unit: 'percent-decimal' }, expected: '0.111%' },
  { value: 0.00111111, format: { unit: 'percent-decimal', decimalPlaces: 0 }, expected: '0%' },
  { value: 0.00111111, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '0.1111%' },

  { value: 0.01, format: { unit: 'percent-decimal' }, expected: '1%' },
  { value: 0.01, format: { unit: 'percent-decimal', decimalPlaces: 0 }, expected: '1%' },
  { value: 0.01, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '1.0000%' },

  { value: 0.01111, format: { unit: 'percent-decimal' }, expected: '1.11%' },
  { value: 0.01111, format: { unit: 'percent-decimal', decimalPlaces: 0 }, expected: '1%' },
  { value: 0.01111, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '1.1110%' },

  { value: 0.11, format: { unit: 'percent-decimal' }, expected: '11%' },
  { value: 0.11, format: { unit: 'percent-decimal', decimalPlaces: 0 }, expected: '11%' },
  { value: 0.11, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '11.0000%' },

  { value: 0.1111, format: { unit: 'percent-decimal' }, expected: '11.1%' },
  { value: 0.1111, format: { unit: 'percent-decimal', decimalPlaces: 0 }, expected: '11%' },
  { value: 0.1111, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '11.1100%' },

  { value: 1, format: { unit: 'percent-decimal' }, expected: '100%' },
  { value: 1, format: { unit: 'percent-decimal', decimalPlaces: 0 }, expected: '100%' },
  { value: 1, format: { unit: 'percent-decimal', decimalPlaces: 4 }, expected: '100.0000%' },

  { value: 10, format: { unit: 'percent-decimal' }, expected: '1,000%' },

  { value: 14.5678, format: { decimalPlaces: 2 }, expected: '14.57%' },
];

describe('formatValue', () => {
  it.each(PERCENT_TESTS)('returns $expected when $value formatted as $format', (args: UnitTestCase) => {
    const { value, format: unit, expected } = args;
    expect(formatValue(value, unit)).toEqual(expected);
  });
});
