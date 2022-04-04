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
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { formatValue, UnitOptions } from './model/units';
import { ECharts } from './ECharts';

use([EChartsGaugeChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

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

export type GaugeChartData = number | null | undefined;

interface GaugeChartProps {
  width: number;
  height: number;
  data: GaugeChartData;
  unit: UnitOptions;
  axisLine: GaugeSeriesOption['axisLine'];
}

export function GaugeChart(props: GaugeChartProps) {
  const { width, height, data, unit, axisLine } = props;

  const option: EChartsOption = useMemo(() => {
    if (data === null || data === undefined) return noDataOption;

    const calculatedValue = data;
    return {
      title: {
        show: false,
      },
      tooltip: {
        show: false,
      },
      series: [
        {
          type: 'gauge',
          center: ['50%', '65%'],
          radius: '100%',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 12,
          silent: true,
          progress: {
            show: true,
            width: 22,
            itemStyle: {
              color: 'auto',
            },
          },
          pointer: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: [[1, '#e1e5e9']], // TODO (sjcobb): use future chart theme colors
              width: 22,
            },
          },
          axisTick: {
            show: false,
            distance: -28,
            splitNumber: 5,
            lineStyle: {
              width: 2,
              color: '#999',
            },
          },
          splitLine: {
            show: false,
            distance: -32,
            length: 6,
            lineStyle: {
              width: 2,
              color: '#999',
            },
          },
          axisLabel: {
            show: false,
            distance: -18,
            color: '#999',
            fontSize: 12,
          },
          anchor: {
            show: false,
          },
          title: {
            show: false,
          },
          detail: {
            show: false,
          },
          data: [
            {
              value: calculatedValue,
            },
          ],
        },
        {
          type: 'gauge',
          center: ['50%', '65%'],
          radius: '114%',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          pointer: {
            show: false,
            itemStyle: {
              color: 'auto',
            },
          },
          axisLine,
          axisTick: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          detail: {
            show: true,
            valueAnimation: false,
            width: '60%',
            borderRadius: 8,
            offsetCenter: [0, '-9%'],
            fontSize: 20,
            fontWeight: 'bolder',
            color: 'inherit',
            formatter: (value: number) => {
              return formatValue(value, {
                kind: unit.kind,
                decimal_places: 0,
              });
            },
          },
          data: [
            {
              value: calculatedValue,
            },
          ],
        },
      ],
    };
  }, [data, unit, axisLine]);

  return (
    <ECharts
      sx={{
        width: width,
        height: height,
      }}
      option={option}
    />
  );
}
