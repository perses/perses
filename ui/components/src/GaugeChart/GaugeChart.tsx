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

import { useDeepMemo } from '@perses-dev/core';
import { use, EChartsCoreOption } from 'echarts/core';
import { GaugeChart as EChartsGaugeChart, GaugeSeriesOption } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { formatValue, UnitOptions } from '../model/units';
import { EChart } from '../EChart';

use([EChartsGaugeChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

const PROGRESS_WIDTH = 16;

// adjusts when to show pointer icon
const GAUGE_SMALL_BREAKPOINT = 170;

export type GaugeChartValue = number | null | undefined;

export type GaugeSeries = {
  value: GaugeChartValue;
  label: string;
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

  // useDeepMemo ensures value size util does not rerun everytime you hover on the chart
  const option: EChartsCoreOption = useDeepMemo(() => {
    if (data.value === undefined || data.value === null) return chartsTheme.noDataOption;

    // adjusts fontSize depending on number of characters
    const valueSizeClamp = getResponsiveValueSize(data.value, unit, width, height);

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
            width: PROGRESS_WIDTH,
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
              width: PROGRESS_WIDTH,
            },
          },
          axisTick: {
            show: false,
            distance: 0,
          },
          splitLine: {
            show: false,
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
              value: data.value,
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
            show: true,
            // pointer hidden for small panels, path taken from ex: https://echarts.apache.org/examples/en/editor.html?c=gauge-grade
            icon: width > GAUGE_SMALL_BREAKPOINT ? 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z' : 'none',
            length: 10,
            width: 5,
            offsetCenter: [0, '-49%'],
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
            color: 'inherit', // allows value color to match active threshold color
            fontSize: valueSizeClamp,
            formatter: (value: number) => {
              return formatValue(value, unit);
            },
          },
          data: [
            {
              value: data.value,
              name: data.label,
              // TODO: new UX for series names, create separate React component or reuse ListLegendItem
              // https://echarts.apache.org/en/option.html#series-gauge.data.title
              title: {
                show: true,
                color: chartsTheme.echartsTheme.textStyle?.color ?? 'inherit', // series name font color
                offsetCenter: [0, '55%'],
                overflow: 'truncate',
                fontSize: 12,
                width: width * 0.8,
              },
            },
          ],
        },
      ],
    };
  }, [data, width, height, chartsTheme, unit, axisLine, max]);

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

/**
 * Responsive font size depending on number of characters, clamp used
 * to ensure size stays within given range
 */
export function getResponsiveValueSize(value: number, unit: UnitOptions, width: number, height: number) {
  const MIN_SIZE = 3;
  const MAX_SIZE = 24;
  const SIZE_MULTIPLIER = 0.7;
  const formattedValue = formatValue(value, unit);
  const valueCharacters = formattedValue.length ?? 2;
  const valueSize = (Math.min(width, height) / valueCharacters) * SIZE_MULTIPLIER;
  return `clamp(${MIN_SIZE}px, ${valueSize}px, ${MAX_SIZE}px)`;
}
