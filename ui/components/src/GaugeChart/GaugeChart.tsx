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
import { use, EChartsCoreOption } from 'echarts/core';
import { GaugeChart as EChartsGaugeChart, GaugeSeriesOption } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { formatValue, UnitOptions } from '../model/units';
import { EChart } from '../EChart';

use([EChartsGaugeChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

export type GaugeChartValue = number | null | undefined;

export type GaugeSeries = {
  value: GaugeChartValue;
  label: string;
};

export type GaugeSeriesData = {
  gaugeSeries: GaugeSeries[];
};

interface GaugeChartProps {
  width: number;
  height: number;
  data: GaugeSeries;
  unit: UnitOptions;
  axisLine: GaugeSeriesOption['axisLine'];
  max?: number;
}

export function GaugeChart(props: GaugeChartProps) {
  const { width, height, data, unit, axisLine, max } = props;
  const chartsTheme = useChartsTheme();

  const option: EChartsCoreOption = useMemo(() => {
    if (data.value === null || data.value === undefined) return chartsTheme.noDataOption;

    const calculatedValue = data.value;
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
          radius: '86%',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max,
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
            distance: 0,
          },
          splitLine: {
            show: true,
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
          radius: '100%',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max,
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
            width: '60%',
            borderRadius: 8,
            offsetCenter: [0, '-9%'],
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
              name: data.label,
              // TODO: new UX for series names, create separate React component or reuse ListLegendItem
              // https://echarts.apache.org/en/option.html#series-gauge.data.title
              title: {
                show: true,
                offsetCenter: [0, '58%'],
                overflow: 'truncate', // 'breakAll'
                fontSize: 11,
                width: width * 0.8,
              },
            },
          ],
        },
      ],
    };
  }, [data, width, chartsTheme, unit, axisLine, max]);

  return (
    <EChart
      sx={{
        width: width,
        height: height,
      }}
      option={option}
      theme={chartsTheme.echartsTheme}
    />
  );
}
