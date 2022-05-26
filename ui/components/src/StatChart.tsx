// Copyright 2022 The Perses Authors
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

import { useMemo } from 'react';
import { useTheme } from '@mui/material';
import { merge } from 'lodash-es';
import type { EChartsOption } from 'echarts';
import { use } from 'echarts/core';
import { GaugeChart as EChartsGaugeChart, GaugeSeriesOption } from 'echarts/charts';
import { LineChart as EChartsLineChart, LineSeriesOption } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { formatValue, UnitOptions } from './model/units';
import { EChart } from './EChart';
import { GraphSeriesValueTuple } from './model/graph';

use([
  EChartsGaugeChart,
  EChartsLineChart,
  GridComponent,
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const noDataOption = {
  title: {
    show: true,
    textStyle: {
      color: 'grey',
      fontSize: 16,
      fontWeight: 400,
    },
    text: 'No data',
    left: 'center',
    top: 'center',
  },
  xAxis: {
    show: false,
  },
  yAxis: {
    show: false,
  },
  series: [],
};

export interface GraphSeries {
  name: string;
  values: Iterable<GraphSeriesValueTuple>;
}

export interface StatChartData {
  calculatedValue: number | null | undefined;
  seriesData: GraphSeries | null | undefined;
  name?: string;
}

interface StatChartProps {
  width: number;
  height: number;
  data: StatChartData;
  unit: UnitOptions;
  backgroundColor?: string;
  sparkline?: LineSeriesOption;
}

export function StatChart(props: StatChartProps) {
  const { width, height, data, unit, backgroundColor, sparkline } = props;
  const theme = useTheme();

  const option: EChartsOption = useMemo(() => {
    if (data.seriesData === undefined) return {};
    if (data.seriesData === null || data.calculatedValue === undefined) return noDataOption;

    const series = data.seriesData;
    const calculatedValue = data.calculatedValue ?? 0;
    const isLargePanel = width > 250 ? true : false;
    const showName = isLargePanel;
    const name = showName === true ? data.name : '';
    const smallestSide = Math.min(width, height * 1.2);
    const baseFontSize = Math.min((smallestSide / 4) * 0.65, 72);
    const nameFontSize = baseFontSize * 0.5;

    const statSeries: Array<GaugeSeriesOption | LineSeriesOption> = [
      {
        type: 'gauge',
        data: [
          {
            value: calculatedValue,
            name: name,
          },
        ],
        detail: {
          show: true,
          offsetCenter: ['0%', '-65%'],
          formatter: [`{name|${name}}`, `{value|${formatValue(calculatedValue, unit)}}`].join('\n'),
          rich: {
            name: {
              padding: showName === true ? [0, 0, 5, 0] : 0,
              fontSize: nameFontSize,
              lineHeight: nameFontSize * 2.5,
              fontWeight: 500,
            },
            value: {},
          },
        },
        center: ['50%', '60%'],
        animation: false,
        silent: true,
        title: { show: false },
        progress: { show: false },
        pointer: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        zlevel: 2,
      },
    ];

    if (sparkline !== undefined) {
      const lineSeries: LineSeriesOption = {
        type: 'line',
        data: [...series.values],
        zlevel: 1,
        symbol: 'none',
        animation: false,
        lineStyle: {
          color: '#FFFFFF',
          opacity: 0.6,
        },
        areaStyle: {
          color: '#FFFFFF',
          opacity: 0.3,
        },
        silent: true,
      };
      const mergedSeries = merge(lineSeries, sparkline);
      statSeries.push(mergedSeries);
    }

    const option = {
      title: {
        show: false,
      },
      grid: [
        {
          show: true,
          backgroundColor: backgroundColor,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          containLabel: false,
          borderWidth: 0,
        },
        {
          show: false,
          top: '45%', // adds space above sparkline
          right: 0,
          bottom: 0,
          left: 0,
          containLabel: false,
        },
      ],
      xAxis: {
        type: 'time',
        show: false,
        boundaryGap: false,
        gridIndex: 1, // sparkline grid
      },
      yAxis: {
        type: 'value',
        show: false,
        gridIndex: 1,
      },
      tooltip: {
        show: false,
      },
      series: statSeries,
      textStyle: {
        color: backgroundColor === 'transparent' ? theme.palette.text.primary : '#FFFFFF',
        fontSize: 25,
        lineHeight: 18,
        fontFamily: '"Lato", sans-serif',
        fontWeight: 'bold',
      },
      media: [
        {
          query: {
            maxWidth: 150,
          },
          option: {
            textStyle: {
              fontSize: 12,
            },
          },
        },
        {
          query: {
            minWidth: 150,
          },
          option: {
            textStyle: {
              fontSize: `max(14px, ${baseFontSize}px)`,
              lineHeight: Math.min(16, baseFontSize * 1.2),
            },
          },
        },
      ],
    };

    return option;
  }, [data, height, theme, unit, width, sparkline, backgroundColor]);

  return (
    <EChart
      sx={{
        width: width,
        height: height,
      }}
      option={option}
    />
  );
}
