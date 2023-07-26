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
import { getClosestTimestamp } from './chart-actions';

const TEST_TIME_SERIES_VALUES: TimeSeriesValueTuple[] = [
  [1690381125000, 0.12],
  [1690381140000, 0.12],
  [1690381155000, 0.13],
  [1690381170000, 0.13],
  [1690381185000, 0.14],
  [1690381200000, 0.14],
  [1690381215000, 0.16],
  [1690381230000, 0.16],
  [1690381245000, 0.16],
  [1690381260000, 0.16],
  [1690381275000, 0.16],
  [1690381290000, 0.15],
  [1690381305000, 0.15],
  [1690381320000, 0.16],
  [1690381335000, 0.17],
  [1690381350000, 0.17],
  [1690381365000, 0.17],
  [1690381380000, 0.16],
  [1690381395000, 0.16],
  [1690381410000, 0.16],
  [1690381425000, 0.15],
];

describe('getClosestTimestamp', () => {
  it('should determine closest timestamp to current cursor xValue', () => {
    expect(getClosestTimestamp(1690381320276.3362, null, Infinity, TEST_TIME_SERIES_VALUES)).toEqual(1690381320000);
  });
});
