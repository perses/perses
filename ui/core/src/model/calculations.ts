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

import { TimeSeriesValueTuple } from './time-series-queries';

export const DEFAULT_CALCULATION: CalculationType = 'last'; // aligned with cue

export const CalculationsMap = {
  first: first,
  last: last,
  'first-number': firstNumber,
  'last-number': lastNumber,
  mean: mean,
  sum: sum,
  min: min,
  max: max,
};

export type CalculationType = keyof typeof CalculationsMap;

export type CalculationConfig = {
  label: string;
  description: string;
};

export const CALCULATIONS_CONFIG: Readonly<Record<CalculationType, CalculationConfig>> = {
  first: {
    label: 'First',
    description: 'First value',
  },
  last: {
    label: 'Last',
    description: 'Last value',
  },
  'first-number': {
    label: 'First *',
    description: 'First numeric value',
  },
  'last-number': {
    label: 'Last *',
    description: 'Last numeric value',
  },
  mean: {
    label: 'Avg',
    description: 'Average value excluding nulls',
  },
  sum: {
    label: 'Sum',
    description: 'The sum of all values',
  },
  min: {
    label: 'Min',
    description: 'Minimum value',
  },
  max: {
    label: 'Max',
    description: 'Maximum value',
  },
} as const;

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
  const calculations = includeCalculations.reduce(
    (initResult, calculation) => {
      initResult[calculation] = undefined;
      return initResult;
    },
    {} as Record<string, CalculationValue>
  );

  // We save these values as separate values instead of directly setting them
  // in the calculations because they are needed by multiple calculations.
  let nonNullCount = 0;
  let sum = 0;

  // We use this large function capable of performing one or more calculations
  // in a single iteration of the data to minimize the performance impact of
  // generating multiple calculations for large timeseries values. This is
  // less optimized for certain single calculations when done in isolation (e.g.
  // `last`), but will be more performant in the more expensive cases where
  // multiple values are being used (e.g. table legend).
  values.forEach((tuple, i) => {
    const value = tuple[1];

    if (i === 0 && 'first' in calculations) {
      calculations.first = value;
    }
    if (i === values.length - 1 && 'last' in calculations) {
      calculations.last = value;
    }

    // Handling specific to non-null values.
    if (typeof value === 'number') {
      nonNullCount += 1;
      sum += value;

      if ('first-number' in calculations && calculations['first-number'] === undefined) {
        // Save the first number we see.
        calculations['first-number'] = value;
      }

      if ('last-number' in calculations) {
        // Keep setting the numbers we see, which will eventually be set to the
        // last number when finished iterating.
        calculations['last-number'] = value;
      }

      if ('min' in calculations) {
        if (typeof calculations.min !== 'number') {
          // Init the first time we see a number
          calculations.min = value;
        } else {
          // Use lowest value once initialized
          calculations.min = Math.min(calculations.min, value);
        }
      }

      if ('max' in calculations) {
        if (typeof calculations.max !== 'number') {
          // Init the first time we see a number
          calculations.max = value;
        } else {
          // Use highest value once initialized
          calculations.max = Math.max(calculations.max, value);
        }
      }
    }
  });

  // Set calculations that require iterating over all values.
  if (nonNullCount > 0 && 'sum' in calculations) {
    calculations.sum = sum;
  }

  if (nonNullCount > 0 && 'mean' in calculations) {
    calculations.mean = sum / nonNullCount;
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
  return getCalculation(values, 'first');
}

function last(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'last');
}

function firstNumber(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'first-number');
}

function lastNumber(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'last-number');
}

function mean(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'mean');
}

function sum(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'sum');
}

function min(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'min');
}

function max(values: TimeSeriesValueTuple[]): CalculationValue {
  return getCalculation(values, 'max');
}
