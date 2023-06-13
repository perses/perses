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

import { TimeSeriesValueTuple } from '@perses-dev/core';
import { CalculationsMap, CalculationType, getCalculations } from './calculations';

interface CalculationTestCase {
  values: TimeSeriesValueTuple[];
  calculation: CalculationType;
  expected: number | undefined | null;
}

// describe('getCalculations', () => {
//   test('single calc', () => {
//     const result = getCalculations(
//       [
//         [1677386865000, 100],
//         [1677386880000, 99],
//       ],
//       ['First']
//     );
//   });
// });

describe('Time series calculation utils', () => {
  const tests: CalculationTestCase[] = [
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 99],
      ],
      calculation: 'FirstNumber',
      expected: 100,
    },
    {
      values: [
        [1677386895000, null],
        [1677386865000, 100],
        [1677386880000, 200],
      ],
      calculation: 'FirstNumber',
      expected: 100,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 99],
      ],
      calculation: 'First',
      expected: 100,
    },
    {
      values: [
        [1677386895000, null],
        [1677386865000, 100],
        [1677386880000, 200],
      ],
      calculation: 'First',
      expected: null,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 99],
      ],
      calculation: 'LastNumber',
      expected: 99,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 200],
        [1677386895000, null],
      ],
      calculation: 'LastNumber',
      expected: 200,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 200],
        [1677386895000, null],
      ],
      calculation: 'Last',
      expected: null,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 200],
      ],
      calculation: 'Last',
      expected: 200,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 200],
        [1677386895000, 300],
      ],
      calculation: 'Sum',
      expected: 600,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 200],
        [1677386880000, null],
        [1677386895000, 300],
      ],
      calculation: 'Sum',
      expected: 600,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 200],
        [1677386895000, 300],
      ],
      calculation: 'Mean',
      expected: 200,
    },
    {
      values: [
        [1677386865000, 100],
        [1677386880000, 200],
        [1677386895000, 300],
        [1677386895000, null],
      ],
      calculation: 'Mean',
      expected: 200,
    },
    {
      values: [
        [1677386865000, 300],
        [1677386880000, 200],
        [1677386895000, 500],
      ],
      calculation: 'Min',
      expected: 200,
    },
    {
      values: [
        [1677386865000, null],
        [1677386865000, 300],
        [1677386880000, 150],
        [1677386895000, 500],
      ],
      calculation: 'Min',
      expected: 150,
    },
    {
      values: [[1677386865000, null]],
      calculation: 'Min',
      expected: undefined,
    },
    {
      values: [],
      calculation: 'Min',
      expected: undefined,
    },
    {
      values: [
        [1677386865000, 300],
        [1677386880000, 200],
        [1677386895000, 500],
      ],
      calculation: 'Max',
      expected: 500,
    },
    {
      values: [
        [1677386865000, null],
        [1677386865000, 300],
        [1677386880000, 150],
        [1677386895000, 550],
      ],
      calculation: 'Max',
      expected: 550,
    },
    {
      values: [[1677386865000, null]],
      calculation: 'Max',
      expected: undefined,
    },
    {
      values: [],
      calculation: 'Max',
      expected: undefined,
    },
  ];
  it.each(tests)('returns $expected when $values formatted as $calculation', (args: CalculationTestCase) => {
    const { values, calculation, expected } = args;
    const calculate = CalculationsMap[calculation];
    expect(calculate(values)).toEqual(expected);
  });
});
