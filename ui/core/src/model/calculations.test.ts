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
import { CalculationsMap, CalculationType, getCalculation, getCalculations } from './calculations';

interface CalculationTestCase {
  values: TimeSeriesValueTuple[];
  calculation: CalculationType;
  expected: number | undefined | null;
}

const singleCalculationTests: CalculationTestCase[] = [
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 99],
    ],
    calculation: 'first-number',
    expected: 100,
  },
  {
    values: [
      [1677386895000, null],
      [1677386865000, 100],
      [1677386880000, 200],
    ],
    calculation: 'first-number',
    expected: 100,
  },
  {
    values: [
      [1677386895000, null],
      [1677386865000, null],
    ],
    calculation: 'first-number',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'first-number',
    expected: undefined,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 99],
    ],
    calculation: 'first',
    expected: 100,
  },
  {
    values: [
      [1677386895000, null],
      [1677386865000, 100],
      [1677386880000, 200],
    ],
    calculation: 'first',
    expected: null,
  },
  {
    values: [],
    calculation: 'first',
    expected: undefined,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 99],
    ],
    calculation: 'last-number',
    expected: 99,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 200],
      [1677386895000, null],
    ],
    calculation: 'last-number',
    expected: 200,
  },
  {
    values: [[1677386895000, null]],
    calculation: 'last-number',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'last-number',
    expected: undefined,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 200],
      [1677386895000, null],
    ],
    calculation: 'last',
    expected: null,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 200],
    ],
    calculation: 'last',
    expected: 200,
  },
  {
    values: [],
    calculation: 'last',
    expected: undefined,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 200],
      [1677386895000, 300],
    ],
    calculation: 'sum',
    expected: 600,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 200],
      [1677386880000, null],
      [1677386895000, 300],
    ],
    calculation: 'sum',
    expected: 600,
  },
  {
    values: [
      [1677386880000, null],
      [1677386895000, null],
    ],
    calculation: 'sum',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'sum',
    expected: undefined,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 200],
      [1677386895000, 300],
    ],
    calculation: 'mean',
    expected: 200,
  },
  {
    values: [
      [1677386865000, 100],
      [1677386880000, 200],
      [1677386895000, 300],
      [1677386895000, null],
    ],
    calculation: 'mean',
    expected: 200,
  },
  {
    values: [
      [1677386865000, null],
      [1677386895000, null],
    ],
    calculation: 'mean',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'mean',
    expected: undefined,
  },
  {
    values: [
      [1677386865000, 300],
      [1677386880000, 200],
      [1677386895000, 500],
    ],
    calculation: 'min',
    expected: 200,
  },
  {
    values: [
      [1677386865000, null],
      [1677386865000, 300],
      [1677386880000, 150],
      [1677386895000, 500],
    ],
    calculation: 'min',
    expected: 150,
  },
  {
    values: [[1677386865000, null]],
    calculation: 'min',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'min',
    expected: undefined,
  },
  {
    values: [
      [1677386865000, 300],
      [1677386880000, 200],
      [1677386895000, 500],
    ],
    calculation: 'max',
    expected: 500,
  },
  {
    values: [
      [1677386865000, null],
      [1677386865000, 300],
      [1677386880000, 150],
      [1677386895000, 550],
    ],
    calculation: 'max',
    expected: 550,
  },
  {
    values: [[1677386865000, null]],
    calculation: 'max',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'max',
    expected: undefined,
  },
];

describe('getCalculation', () => {
  test.each(singleCalculationTests)(
    'returns $expected when $values formatted as $calculation',
    (args: CalculationTestCase) => {
      const { values, calculation, expected } = args;
      expect(getCalculation(values, calculation)).toEqual(expected);
    }
  );
});

describe('Time series calculation utils', () => {
  test.each(singleCalculationTests)(
    'returns $expected when $values formatted as $calculation',
    (args: CalculationTestCase) => {
      const { values, calculation, expected } = args;
      const calculate = CalculationsMap[calculation];
      expect(calculate(values)).toEqual(expected);
    }
  );
});

// Only doing a few simple tests for `getCalculations` because it is used under
// the hood of `getCalculation` and very well exercised in the tests above.
describe('getCalculations', () => {
  test('only returns the specified calculations', () => {
    const values: TimeSeriesValueTuple[] = [
      [1677386865000, 300],
      [1677386880000, 200],
      [1677386895000, 500],
    ];
    const calculations = getCalculations(values, ['first', 'last']);
    expect(Object.keys(calculations)).toEqual(['first', 'last']);
    expect(calculations.first).toEqual(300);
    expect(calculations.last).toEqual(500);
  });

  test('can include all calculations', () => {
    const values: TimeSeriesValueTuple[] = [
      [1677386865000, 300],
      [1677386880000, 200],
      [1677386895000, 500],
    ];
    const calculations = getCalculations(values, [
      'first',
      'last',
      'first-number',
      'last-number',
      'min',
      'max',
      'mean',
      'sum',
    ]);
    expect(calculations.first).toEqual(300);
    expect(calculations.last).toEqual(500);
    expect(calculations['first-number']).toEqual(300);
    expect(calculations['last-number']).toEqual(500);
    expect(calculations.min).toEqual(200);
    expect(calculations.max).toEqual(500);
    expect(calculations.mean).toEqual(1000 / 3);
    expect(calculations.sum).toEqual(1000);
  });
});
