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

// TODO (sjcobb): update after package reorg
import { CalculationsMap } from '../../../panels-plugin/src/model/calculations';

// https://github.com/grafana/grafana/blob/v7.5.x/packages/grafana-data/src/transformations/fieldReducer.ts
export const TransformationsMap = {
  sum: 'tbd',
  max: 'tbd',
  min: 'tbd',
  logmin: 'tbd',
  mean: CalculationsMap.Mean,
  last: CalculationsMap.Last,
  first: CalculationsMap.First,
  count: 'tbd',
  range: 'tbd',
  diff: 'tbd',
  diffperc: 'tbd',
  delta: 'tbd',
  step: 'tbd',
  firstNotNull: 'tbd',
  lastNotNull: CalculationsMap.LastNumber,
  changeCount: 'tbd',
  distinctCount: 'tbd',
  allIsZero: 'tbd',
  allIsNull: 'tbd',
  allValues: 'tbd',
};
