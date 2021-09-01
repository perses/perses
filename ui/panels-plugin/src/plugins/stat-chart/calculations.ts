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

import { findLast, mean as _mean } from 'lodash-es';

export const CalculationsMap = {
  First: first,
  Last: last,
  LastNumber: lastNumber,
  Mean: mean,
};

export type CalculationType = keyof typeof CalculationsMap;

function first(values: number[]): number | undefined {
  return values[0];
}

function last(values: number[]): number | undefined {
  if (values.length <= 0) return undefined;
  return values[values.length - 1];
}

function lastNumber(values: number[]): number | undefined {
  return findLast(values, (val) => isNaN(val) === false);
}

function mean(values: number[]): number | undefined {
  if (values.length <= 0) return undefined;
  return _mean(values);
}
