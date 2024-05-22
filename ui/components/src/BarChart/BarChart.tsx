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

import { useMemo } from 'react';
import { FormatOptions, formatValue } from '@perses-dev/core';
import { use, EChartsCoreOption } from 'echarts/core';
import { BarChart as EChartsBarChart } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Box } from '@mui/material';
import { useChartsTheme } from '../context/ChartsProvider';
import { EChart } from '../EChart';
import { ModeOption } from '../ModeSelector';
import { getFormattedAxis } from '../utils';

use([EChartsBarChart, GridComponent, DatasetComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

const BAR_WIN_WIDTH = 14;
const BAR_GAP = 6;

export interface BarChartData {
  label: string;
  value: number | null;
}

export interface BarChartProps {
  width: number;
  height: number;
  data: BarChartData[] | null;
  format?: FormatOptions;
  mode?: ModeOption;
}

export function BarChart(props: BarChartProps) {
  const { width, height, data, format = { unit: 'decimal' }, mode = 'value' } = props;
  const chartsTheme = useChartsTheme();

  const option: EChartsCoreOption = useMemo(() => {
    if (!data || !data.length) return chartsTheme.noDataOption;

    const source: Array<Array<BarChartData['label'] | BarChartData['value']>> = [];
    data.map((d) => {
      source.push([d.label, d.value]);
    });

    return {
      title: {
        show: false,
      },
      dataset: [
        {
          dimensions: ['label', 'value'],
          source: source,
        },
      ],
      xAxis: getFormattedAxis({}, format),
      yAxis: {
        type: 'category',
        splitLine: {
          show: false,
        },
        axisLabel: {
          overflow: 'truncate',
          width: width / 3,
        },
      },
      series: {
        type: 'bar',
        label: {
          show: true,
          position: 'right',
          formatter: (params: { data: number[] }) => {
            if (mode === 'percentage') {
              return (
                params.data[1] &&
                formatValue(params.data[1], {
                  unit: 'percent',
                  decimalPlaces: format.decimalPlaces,
                })
              );
            }
            return params.data[1] && formatValue(params.data[1], format);
          },
          barMinWidth: BAR_WIN_WIDTH,
          barCategoryGap: BAR_GAP,
        },
        itemStyle: {
          borderRadius: 4,
          color: chartsTheme.echartsTheme[0],
        },
      },
      tooltip: {
        appendToBody: true,
        confine: true,
        formatter: (params: { name: string; data: number[] }) =>
          params.data[1] && `<b>${params.name}</b> &emsp; ${formatValue(params.data[1], format)}`,
      },
      // increase distance between grid and container to prevent y axis labels from getting cut off
      grid: {
        left: '5%',
        right: '5%',
      },
    };
  }, [data, chartsTheme, width, mode, format]);

  return (
    <Box sx={{ width: width, height: height, overflow: 'auto' }}>
      <EChart
        sx={{
          minHeight: height,
          height: data ? data.length * (BAR_WIN_WIDTH + BAR_GAP) : '100%',
        }}
        option={option}
        theme={chartsTheme.echartsTheme}
      />
    </Box>
  );
}
