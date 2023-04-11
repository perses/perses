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

import { EChartsTimeSeries } from '@perses-dev/components';
import { convertPercentThreshold, convertPanelYAxis } from './data-transform';

const MAX_VALUE = 120;
const MOCK_ECHART_TIME_SERIES_DATA: EChartsTimeSeries[] = [
  {
    data: [10, 30, 80, 50],
  },
  {
    data: [20, MAX_VALUE, 17, 30],
  },
];

describe('convertPercentThreshold', () => {
  it('should return 25 if percent threshold is 25 and max is 100', () => {
    const value = convertPercentThreshold(25, MOCK_ECHART_TIME_SERIES_DATA, 100);
    expect(value).toEqual(25);
  });

  it('should return 60 if percent threshold is 50, max is 100, and min is 20', () => {
    const value = convertPercentThreshold(50, MOCK_ECHART_TIME_SERIES_DATA, 100, 20);
    expect(value).toEqual(60);
  });

  it('should return 50% of the max value in time series data if max is undefined', () => {
    const value = convertPercentThreshold(50, MOCK_ECHART_TIME_SERIES_DATA);
    expect(value).toEqual(0.5 * MAX_VALUE);
  });
});

describe('convertPanelYAxis', () => {
  it('should convert a Perses y_axis spec to the ECharts equivalent', () => {
    const persesAxis = {
      show: true,
      label: 'Axis Label',
      unit: {
        kind: 'PercentDecimal',
        decimal_places: 0,
      },
      min: 0.1,
      max: 1,
    };
    const echartsAxis = convertPanelYAxis(persesAxis);
    // Axis label is handled outside of echarts since it is built with a custom React component.
    expect(echartsAxis).toEqual({ max: 1, min: 0.1, show: true });
  });
});
