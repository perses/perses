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

import findLast from 'lodash/findLast';
import { default as lodashMean } from 'lodash/mean';
import { TimeSeriesValueTuple } from '@perses-dev/core';

// TODO: move this file and calculations.test.ts to @perses-dev/core
export const CalculationsMap = {
  First: first,
  Last: last,
  FirstNumber: firstNumber,
  LastNumber: lastNumber,
  Mean: mean,
  Sum: sum,
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
    label: 'First number',
    description: 'First numeric value',
  },
  LastNumber: {
    label: 'Last number',
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
} as const;

export const DEFAULT_CALCULATION: CalculationType = 'Sum';

type CalculationValue = number | null | undefined;

function first(values: TimeSeriesValueTuple[]): CalculationValue {
  const tuple = values[0];
  return tuple === undefined ? undefined : getValue(tuple);
}

function last(values: TimeSeriesValueTuple[]): CalculationValue {
  if (values.length <= 0) return undefined;

  const tuple = values[values.length - 1];
  return tuple === undefined ? undefined : getValue(tuple);
}

function firstNumber(values: TimeSeriesValueTuple[]): CalculationValue {
  const tuple = values.find((tuple) => typeof getValue(tuple) === 'number');
  return tuple === undefined ? undefined : getValue(tuple);
}

function lastNumber(values: TimeSeriesValueTuple[]): CalculationValue {
  const tuple = findLast(values, (tuple) => typeof getValue(tuple) === 'number');
  return tuple === undefined ? undefined : getValue(tuple);
}

function mean(values: TimeSeriesValueTuple[]): CalculationValue {
  if (values.length <= 0) return undefined;
  return lodashMean(getNonNullValues(values));
}

function sum(values: TimeSeriesValueTuple[]): CalculationValue {
  if (values.length <= 0) return undefined;

  return values.reduce((total, tupleValue) => {
    const value = getValue(tupleValue);
    if (typeof value === 'number') {
      total += value;
    }

    return total;
  }, 0);
}

function getNonNullValues(values: TimeSeriesValueTuple[]) {
  return values.map(getValue).filter((value) => typeof value === 'number');
}

function getValue(valueTuple: TimeSeriesValueTuple) {
  return valueTuple[1];
}
