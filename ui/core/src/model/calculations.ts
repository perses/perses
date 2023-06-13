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

export const CalculationsMap = {
  First: first,
  Last: last,
  FirstNumber: firstNumber,
  LastNumber: lastNumber,
  Mean: mean,
  Sum: sum,
  Min: min,
  Max: max,
};

export type CalculationType = keyof typeof CalculationsMap;

export type CalculationConfig = {
  label: string;
  description: string;
};

export const CALCULATIONS_CONFIG: Readonly<Record<CalculationType, CalculationConfig>> = {
  First: {
    label: 'First',
    description: 'First value',
  },
  Last: {
    label: 'Last',
    description: 'Last value',
  },
  FirstNumber: {
    label: 'First #',
    description: 'First numeric value',
  },
  LastNumber: {
    label: 'Last #',
    description: 'Last numeric value',
  },
  Mean: {
    label: 'Average',
    description: 'Average value excluding nulls',
  },
  Sum: {
    label: 'Sum',
    description: 'The sum of all values',
  },
  Min: {
    label: 'Min',
    description: 'Minimum value',
  },
  Max: {
    label: 'Max',
    description: 'Maximum value',
  },
} as const;

export const DEFAULT_CALCULATION: CalculationType = 'Sum';

type CalculationValue = number | null | undefined;

/**
 * Calculate a multiple values for a set of time series data.
 *
 * @param values - Array of time series data.
 * @param includeCalculations - Array of calculations to include.
 */
export function getCalculations<IncludeCalcs extends CalculationType[]>(
  values: TimeSeriesValueTuple[],
  includeCalculations: IncludeCalcs
): Record<
  // This extract combined with the generics above keeps the key of the returned
  // record to *just* the specified calculations.
  Extract<CalculationType, IncludeCalcs[number]>,
  CalculationValue
> {
  const calculations = includeCalculations.reduce((initResult, calculation) => {
    initResult[calculation] = undefined;
    return initResult;
  }, {} as Record<string, CalculationValue>);

  // We save these values as separate values instead of directly setting them
  // in the calculations because they are needed by multiple calculations.
  let nonNullCount = 0;
  let sum = 0;

  // We use this large function capable of performing one or more calculations
  // in a single iteration of the data to minimize the performance impact of
  // generating multiple calculations for large timeseries values. This is
  // less optimized for certain single calculations when done in isolation (e.g.
  // `Last`), but will be more performant in the more expensive cases where
  // multiple values are being used (e.g. table legend).
  values.forEach((tuple, i) => {
    const value = tuple[1];

    if (i === 0 && 'First' in calculations) {
      calculations.First = value;
    }
    if (i === values.length - 1 && 'Last' in calculations) {
      calculations.Last = value;
    }

    // Handling specific to non-null values.
    if (typeof value === 'number') {
      nonNullCount += 1;
      sum += value;

      if ('FirstNumber' in calculations && calculations.FirstNumber === undefined) {
        // Save the first number we see.
        calculations.FirstNumber = value;
      }

      if ('LastNumber' in calculations) {
        // Keep setting the numbers we see, which will eventually be set to the
        // last number when finished iterating.
        calculations.LastNumber = value;
      }

      if ('Min' in calculations) {
        if (typeof calculations.Min !== 'number') {
          // Init the first time we see a number
          calculations.Min = value;
        } else {
          // Use lowest value once initialized
          calculations.Min = Math.min(calculations.Min, value);
        }
      }

      if ('Max' in calculations) {
        if (typeof calculations.Max !== 'number') {
          // Init the first time we see a number
          calculations.Max = value;
        } else {
          // Use highest value once initialized
          calculations.Max = Math.max(calculations.Max, value);
        }
      }
    }
  });

  // Set calculations that require iterating over all values.
  if (nonNullCount > 0 && 'Sum' in calculations) {
    calculations.Sum = sum;
  }

  if (nonNullCount > 0 && 'Mean' in calculations) {
    calculations.Mean = sum / nonNullCount;
  }

  return calculations;
}

/**
 * Calculate a single value for a set of time series data.
 *
 * Use `getCalculations` instead if you need multiple calculations.
 *
 * @param values - Array of time series data.
 * @param calculation - Name of the calculation to calculate.
 */
export function getCalculation(values: TimeSeriesValueTuple[], calculation: CalculationType) {
  return getCalculations(values, [calculation])[calculation];
}

function first(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'First');
}

function last(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'Last');
}

function firstNumber(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'FirstNumber');
}

function lastNumber(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'LastNumber');
}

function mean(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'Mean');
}

function sum(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'Sum');
}

function min(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'Min');
}

function max(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'Max');
}
