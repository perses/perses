// Copyright 2021 The Perses Authors
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

import { TimeSeriesValueTuple } from '@perses-dev/plugin-system';
import { findLast, meanBy, sumBy } from 'lodash-es';

export const CalculationsMap = {
  First: first,
  Last: last,
  LastNumber: lastNumber,
  Mean: mean,
  Sum: sum,
};

export type CalculationType = keyof typeof CalculationsMap;

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
  return valueTuple[1];
}
