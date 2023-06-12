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
import meanBy from 'lodash/meanBy';
import sumBy from 'lodash/sumBy';
import { TimeSeriesValueTuple } from '@perses-dev/core';

// TODO: move this file and calculations.test.ts to @perses-dev/core
export const CalculationsMap = {
  First: first,
  Last: last,
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
  LastNumber: {
    label: 'Last number',
    description: 'Last numeric value',
  },
  Mean: {
    label: 'Mean',
    description: 'Average value',
  },
  Sum: {
    label: 'Sum',
    description: 'The sum of all values',
  },
} as const;

export const DEFAULT_CALCULATION: CalculationType = 'Sum';

function first(values: TimeSeriesValueTuple[]): number | undefined {
  const tuple = values[0];
  return tuple === undefined ? undefined : getValue(tuple);
}

function last(values: TimeSeriesValueTuple[]): number | undefined {
  if (values.length <= 0) return undefined;

  const tuple = values[values.length - 1];
  return tuple === undefined ? undefined : getValue(tuple);
}

function lastNumber(values: TimeSeriesValueTuple[]): number | undefined {
  const tuple = findLast(values, (tuple) => isNaN(getValue(tuple)) === false);
  return tuple === undefined ? undefined : getValue(tuple);
}

function mean(values: TimeSeriesValueTuple[]): number | undefined {
  if (values.length <= 0) return undefined;
  return meanBy(values, getValue);
}

function sum(values: TimeSeriesValueTuple[]): number | undefined {
  if (values.length <= 0) return undefined;
  return sumBy(values, getValue);
}

function getValue(valueTuple: TimeSeriesValueTuple) {
  const value = valueTuple[1];
  if (value !== null) {
    return value;
  }
  // TODO: refactor utils so null can be returned and LastNotNull supported
  return NaN;
}
