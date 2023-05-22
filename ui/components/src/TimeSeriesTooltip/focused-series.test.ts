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

import { EChartsDataFormat, UnitOptions } from '../model';
import { getNearbySeries, getYBuffer, isWithinPercentageRange } from './focused-series';

describe('getNearbySeries', () => {
  const chartData: EChartsDataFormat = {
    timeSeries: [
      {
        type: 'line',
        name: 'env="demo", instance="demo.do.prometheus", job="node", mode="test"',
        color: 'hsla(-1365438424,50%,50%,0.8)',
        data: [
          0.0002315202231525094, 0.00022873082287300112, 0.00023152022315149463, 0.00023152022315149463,
          0.00022873082287300112,
        ],
        symbol: 'circle',
      },
      {
        type: 'line',
        name: 'env="demo", instance="demo.do.prometheus", job="node", mode="test alt"',
        color: 'hsla(286664040,50%,50%,0.8)',
        data: [0.05245188284519867, 0.0524463040446356, 0.0524463040446356, 0.05247140864723438, 0.052482566248230646],
        symbol: 'circle',
      },
    ],
    xAxis: [1654007865000, 1654007880000, 1654007895000, 1654007910000, 1654007925000],
    rangeMs: 60000,
  };

  // https://echarts.apache.org/en/api.html#echartsInstance.convertFromPixel
  const pointInGrid = [2, 0.0560655737704918]; // converted from chart.getZr() mousemove coordinates

  const yBuffer = 0.02; // calculated from y axis interval

  const focusedSeriesOutput = [
    {
      date: 1654007895000,
      datumIdx: 2,
      isClosestToCursor: true,
      markerColor: 'hsla(286664040,50%,50%,0.8)',
      seriesName: 'env="demo", instance="demo.do.prometheus", job="node", mode="test alt"',
      seriesIdx: 1,
      x: 1654007895000,
      y: 0.0524463040446356,
      formattedY: '0.05',
    },
  ];

  it('should return focused series data for points nearby the cursor', () => {
    const decimalUnit: UnitOptions = {
      kind: 'Decimal',
      decimal_places: 2,
    };
    expect(getNearbySeries(chartData, pointInGrid, yBuffer, undefined, decimalUnit)).toEqual(focusedSeriesOutput);
  });

  it('should return series values formatted as a percent', () => {
    const percentFormattedOutput = [...focusedSeriesOutput];
    if (percentFormattedOutput[0]) {
      percentFormattedOutput[0].formattedY = '5%';
    }
    const percentFormattedUnit: UnitOptions = {
      kind: 'PercentDecimal',
      decimal_places: 0,
    };
    expect(getNearbySeries(chartData, pointInGrid, yBuffer, undefined, percentFormattedUnit)).toEqual(
      percentFormattedOutput
    );
  });
});

describe('getYBuffer', () => {
  it('should return area to search for nearby series', () => {
    expect(getYBuffer({ interval: 1, totalSeries: 10, showAllSeries: false })).toBe(3);
  });

  it('should return entire canvas', () => {
    expect(getYBuffer({ interval: 1, totalSeries: 10, showAllSeries: true })).toBe(10);
  });

  it('should reduce area to search when many series', () => {
    expect(getYBuffer({ interval: 1, totalSeries: 1000, showAllSeries: false })).toBe(0.3);
  });

  it('should return area to search for larger interval', () => {
    expect(getYBuffer({ interval: 10, totalSeries: 10, showAllSeries: false })).toBe(30);
  });

  it('should return entire canvas for larger interval', () => {
    expect(getYBuffer({ interval: 10, totalSeries: 10, showAllSeries: true })).toBe(100);
  });

  it('should reduce area to search for larger interval when many series', () => {
    expect(getYBuffer({ interval: 10, totalSeries: 1000, showAllSeries: false })).toBe(3);
  });
});

describe('isWithinPercentageRange', () => {
  it('should return true when focusedY is within the specified percentage range of yValue', () => {
    const focusedY = 256250000;
    const yValue = 261353472;
    const result = isWithinPercentageRange({ valueToCheck: focusedY, baseValue: yValue, percentage: 5 });
    expect(result).toBe(true);
  });

  it('returns false when focusedY is outside the specified percentage range of yValue', () => {
    const focusedY = 200;
    const yValue = 100;
    const result = isWithinPercentageRange({ valueToCheck: focusedY, baseValue: yValue, percentage: 5 });
    expect(result).toBe(false);
  });
});
