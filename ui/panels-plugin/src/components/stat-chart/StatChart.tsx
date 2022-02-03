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

import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { use } from 'echarts/core';
import { GaugeChart as EChartsGaugeChart, GaugeSeriesOption } from 'echarts/charts';
import { LineChart as EChartsLineChart, LineSeriesOption } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { GraphSeries } from '@perses-ui/core';
import { formatValue, UnitOptions } from '../../model/units'; // TODO (sjcobb): add back formatValue
import { defaultThresholdInput, ThresholdOptions } from '../../model/thresholds';
import { EChartsWrapper } from '../../components/echarts-wrapper/EChartsWrapper';

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

export interface StatChartData {
  calculatedValue: number | null | undefined;
  seriesData: GraphSeries | null | undefined;
  name?: string;
  showName?: boolean;
}

interface StatChartProps {
  width: number;
  height: number;
  data: StatChartData;
  unit: UnitOptions;
  thresholds?: ThresholdOptions;
  showSparkline?: boolean;
}

export function StatChart(props: StatChartProps) {
  const { width, height, data, unit, showSparkline } = props;
  const thresholds = props.thresholds ?? defaultThresholdInput;

  const option: EChartsOption = useMemo(() => {
    if (data.seriesData === undefined) return {};
    if (data.seriesData === null || data.calculatedValue === undefined) return noDataOption;

    const name = data.showName === true ? data.name : '';
    const showName = data.showName ?? true;
    const series = data.seriesData;
    const calculatedValue = data.calculatedValue ?? 0;
    const backgroundColor = thresholds.default_color ?? 'transparent';
    const isLargePanel = width > 250 ? true : false;
    const nameFontSize = isLargePanel === true ? 30 : 12;

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
          offsetCenter: ['0%', showSparkline === true ? '-55%' : '-15%'],
          formatter: [`{name|${name}}`, `{value|${formatValue(calculatedValue, unit)}}`].join('\n'),
          rich: {
            name: {
              padding: showName === true ? [0, 0, 5, 0] : 0,
              fontSize: nameFontSize,
              lineHeight: nameFontSize,
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

    if (showSparkline === true) {
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
      statSeries.push(lineSeries);
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
          top: 100,
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
        gridIndex: 1, // adds space above sparkline
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
        color: backgroundColor === 'transparent' ? '#000000' : '#FFFFFF',
        fontSize: 18,
        lineHeight: 18,
        fontFamily: '"Lato", sans-serif',
      },
      media: [
        {
          query: {
            maxWidth: 180,
          },
          option: {
            textStyle: {
              fontSize: 12,
              lineHeight: 12,
            },
          },
        },
      ],
    };

    return option;
  }, [data, unit, thresholds, width, showSparkline]);

  return (
    <EChartsWrapper
      sx={{
        width: width,
        height: height,
      }}
      option={option}
    />
  );
}
