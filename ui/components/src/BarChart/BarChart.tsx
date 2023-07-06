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
import { UnitOptions, formatValue } from '@perses-dev/core';
import { use, EChartsCoreOption } from 'echarts/core';
import { BarChart as EChartsBarChart } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useTheme } from '@mui/material';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { EChart } from '../EChart';

use([EChartsBarChart, GridComponent, DatasetComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

export interface BarChartData {
  label: string;
  value: number | null | undefined;
}

export interface BarChartProps {
  width: number;
  height: number;
  data: BarChartData[] | null | undefined;
  unit: UnitOptions;
}

export function BarChart(props: BarChartProps) {
  const { width, height, data, unit } = props;
  const chartsTheme = useChartsTheme();
  const theme = useTheme();

  const option: EChartsCoreOption = useMemo(() => {
    if (data == null) return chartsTheme.noDataOption;

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
      xAxis: {},
      yAxis: {
        type: 'category',
        splitLine: {
          show: false,
        },
      },
      series: {
        type: 'bar',
        label: {
          position: 'right',
          show: true,
          formatter: (params: { data: number[] }) => params.data[1] && formatValue(params.data[1], unit),
          color: theme.palette.text.primary,
        },
        itemStyle: {
          borderRadius: 4,
          color: theme.palette.designSystem.blue[400],
        },
      },
      tooltip: {
        formatter: (params: { name: string; data: number[] }) =>
          params.data[1] && `<b>${params.name}</b> - ${formatValue(params.data[1], unit)}`,
        backgroundColor: theme.palette.background.tooltip,
        borderColor: theme.palette.background.tooltip,
        textStyle: {
          color: theme.palette.text.primary,
          fontSize: 12,
        },
      },
    };
  }, [
    data,
    chartsTheme.noDataOption,
    theme.palette.designSystem.blue,
    theme.palette.background.tooltip,
    theme.palette.text.primary,
    unit,
  ]);

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
