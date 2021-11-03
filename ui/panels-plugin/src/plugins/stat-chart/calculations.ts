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

import { ChartValueTuple } from '@perses-ui/core';
import { findLast, meanBy } from 'lodash-es';

export const CalculationsMap = {
  First: first,
  Last: last,
  LastNumber: lastNumber,
  Mean: mean,
};

export type CalculationType = keyof typeof CalculationsMap;

function first(values: ChartValueTuple[]): number | undefined {
  const tuple = values[0];
  return tuple === undefined ? undefined : getValue(tuple);
}

function last(values: ChartValueTuple[]): number | undefined {
  if (values.length <= 0) return undefined;

  const tuple = values[values.length - 1];
  return tuple === undefined ? undefined : getValue(tuple);
}

function lastNumber(values: ChartValueTuple[]): number | undefined {
  const tuple = findLast(values, (tuple) => isNaN(getValue(tuple)) === false);
  return tuple === undefined ? undefined : getValue(tuple);
}

function mean(values: ChartValueTuple[]): number | undefined {
  if (values.length <= 0) return undefined;
  return meanBy(values, getValue);
}

function getValue(valueTuple: ChartValueTuple) {
  return valueTuple[1];
}
