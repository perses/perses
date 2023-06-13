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
      [1677386895000, null],
      [1677386865000, null],
    ],
    calculation: 'FirstNumber',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'FirstNumber',
    expected: undefined,
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
    values: [],
    calculation: 'First',
    expected: undefined,
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
    values: [[1677386895000, null]],
    calculation: 'LastNumber',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'LastNumber',
    expected: undefined,
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
    values: [],
    calculation: 'Last',
    expected: undefined,
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
      [1677386880000, null],
      [1677386895000, null],
    ],
    calculation: 'Sum',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'Sum',
    expected: undefined,
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
      [1677386865000, null],
      [1677386895000, null],
    ],
    calculation: 'Mean',
    expected: undefined,
  },
  {
    values: [],
    calculation: 'Mean',
    expected: undefined,
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
    const calculations = getCalculations(values, ['First', 'Last']);
    expect(Object.keys(calculations)).toEqual(['First', 'Last']);
    expect(calculations.First).toEqual(300);
    expect(calculations.Last).toEqual(500);
  });

  test('can include all calculations', () => {
    const values: TimeSeriesValueTuple[] = [
      [1677386865000, 300],
      [1677386880000, 200],
      [1677386895000, 500],
    ];
    const calculations = getCalculations(values, [
      'First',
      'Last',
      'FirstNumber',
      'LastNumber',
      'Min',
      'Max',
      'Mean',
      'Sum',
    ]);
    expect(calculations.First).toEqual(300);
    expect(calculations.Last).toEqual(500);
    expect(calculations.FirstNumber).toEqual(300);
    expect(calculations.LastNumber).toEqual(500);
    expect(calculations.Min).toEqual(200);
    expect(calculations.Max).toEqual(500);
    expect(calculations.Mean).toEqual(1000 / 3);
    expect(calculations.Sum).toEqual(1000);
  });
});
