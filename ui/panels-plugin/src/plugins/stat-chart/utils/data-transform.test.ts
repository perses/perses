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

import { testChartsTheme } from '@perses-dev/components';
import { ThresholdOptions } from '@perses-dev/core';
import { LineSeriesOption } from 'echarts';
import { SparklineOptions } from '../stat-chart-model';
import { convertSparkline } from './data-transform';

describe('convertSparkline', () => {
  const sparkline: SparklineOptions = {
    color: 'purple',
  };

  const thresholds: ThresholdOptions = {
    steps: [
      {
        color: 'yellow',
        value: 10,
      },
      {
        color: 'orange',
        value: 20,
      },
      {
        color: 'red',
        value: 30,
      },
    ],
  };

  it('should render sparkline color if default threshold color is undefined', () => {
    const options = convertSparkline(testChartsTheme, sparkline, thresholds, 5) as LineSeriesOption;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(options.lineStyle!.color).toEqual(sparkline.color);
  });

  it('should render charts theme default threshold color if defined', () => {
    testChartsTheme.thresholds.defaultColor = 'green';
    const options = convertSparkline(testChartsTheme, {}, thresholds, 5) as LineSeriesOption;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(options.lineStyle!.color).toEqual('green');
  });

  it('should render charts theme default threshold color if defined', () => {
    testChartsTheme.thresholds.defaultColor = 'green';
    const options = convertSparkline(testChartsTheme, sparkline, thresholds, 5) as LineSeriesOption;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(options.lineStyle!.color).toEqual('green');
  });

  it('should render orange if value meets the threshold', () => {
    const options = convertSparkline(testChartsTheme, sparkline, thresholds, 25) as LineSeriesOption;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(options.lineStyle!.color).toEqual('orange');
  });
});
