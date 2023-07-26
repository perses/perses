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

import { TimeSeries, TimeSeriesValueTuple } from '@perses-dev/core';
import { getClosestTimestamp, getClosestTimestampInFullDataset } from './chart-actions';

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

const TEST_TIME_SERIES_DATA: TimeSeries[] = [
  {
    name: 'node_network_transmit_queue_length{device="eth0",env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    values: [
      [1690386135000, 1000],
      [1690386150000, 1000],
      [1690386165000, 1000],
      [1690386180000, 1000],
      [1690386195000, 1000],
      [1690386210000, 1000],
      [1690386225000, 1000],
      [1690386240000, 1000],
      [1690386255000, 1000],
      [1690386270000, 1000],
      [1690386285000, 1000],
      [1690386300000, 1000],
      [1690386315000, 1000],
      [1690386330000, 1000],
      [1690386345000, 1000],
      [1690386360000, 1000],
      [1690386375000, 1000],
      [1690386390000, 1000],
      [1690386405000, 1000],
      [1690386420000, 1000],
      [1690386435000, 1000],
    ],
  },
  {
    name: 'node_network_transmit_queue_length{device="lo",env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    values: [
      [1690386135000, 1000],
      [1690386150000, 1000],
      [1690386165000, 1000],
      [1690386180000, 1000],
      [1690386195000, 1000],
      [1690386210000, 1000],
      [1690386225000, 1000],
      [1690386240000, 1000],
      [1690386255000, 1000],
      [1690386270000, 1000],
      [1690386285000, 1000],
      [1690386300000, 1000],
      [1690386315000, 1000],
      [1690386330000, 1000],
      [1690386345000, 1000],
      [1690386360000, 1000],
      [1690386375000, 1000],
      [1690386390000, 1000],
      [1690386405000, 1000],
      [1690386420000, 1000],
      [1690386435000, 1000],
    ],
  },
  {
    name: 'Threshold 1',
    values: [
      [1690386135000, 300],
      [1690386150000, 300],
      [1690386165000, 300],
      [1690386180000, 300],
      [1690386195000, 300],
      [1690386210000, 300],
      [1690386225000, 300],
      [1690386240000, 300],
      [1690386255000, 300],
      [1690386270000, 300],
      [1690386285000, 300],
      [1690386300000, 300],
      [1690386315000, 300],
      [1690386330000, 300],
      [1690386345000, 300],
      [1690386360000, 300],
      [1690386375000, 300],
      [1690386390000, 300],
      [1690386405000, 300],
      [1690386420000, 300],
      [1690386435000, 300],
    ],
  },
];

describe('getClosestTimestamp', () => {
  it('should determine closest timestamp to current cursor xValue in single dataset source', () => {
    expect(getClosestTimestamp(1690381320276.3362, TEST_TIME_SERIES_VALUES)).toEqual(1690381320000);
  });
});

describe('getClosestTimestampInFullDataset', () => {
  it('should determine closest timestamp to current cursor xValue in full time series data', () => {
    expect(getClosestTimestampInFullDataset(TEST_TIME_SERIES_DATA, 1690386199722.634)).toEqual(1690386195000);
  });
});
