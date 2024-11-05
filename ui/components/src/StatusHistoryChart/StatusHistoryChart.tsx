// Copyright 2024 The Perses Authors
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

import { Box, useTheme } from '@mui/material';
import { HeatmapChart as EChartsHeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponentOption,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { TimeScale } from '@perses-dev/core';
import { EChartsCoreOption } from 'echarts';
import { useChartsTheme } from '../context/ChartsProvider';
import { useTimeZone } from '../context/TimeZoneProvider';
import { EChart } from '../EChart';
import { getFormattedStatusHistoryAxisLabel } from './get-formatted-axis-label';
import { generateTooltipHTML } from './StatusHistoryTooltip';

use([
  EChartsHeatmapChart,
  VisualMapComponent,
  GridComponent,
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export type StatusHistoryData = [number, number, number | undefined];

export interface StatusHistoryDataItem {
  value: StatusHistoryData;
  label?: string;
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

export interface StatusHistoryChartProps {
  height: number;
  data: StatusHistoryDataItem[];
  xAxisCategories: number[];
  yAxisCategories: string[];
  legend?: LegendComponentOption;
  timeScale?: TimeScale;
  colors?: Array<{ value: number | string; color: string }>;
}

export function StatusHistoryChart(props: StatusHistoryChartProps) {
  const { height, data, xAxisCategories, yAxisCategories, timeScale, colors } = props;
  const { timeZone } = useTimeZone();
  const chartsTheme = useChartsTheme();
  const theme = useTheme();

  const option: EChartsCoreOption = {
    tooltip: {
      appendToBody: true,
      formatter: (params: { data: StatusHistoryDataItem; marker: string }) => {
        return generateTooltipHTML({
          data: params.data.value,
          label: params.data.label,
          marker: params.marker,
          xAxisCategories,
          yAxisCategories,
          theme,
        });
      },
    },
    grid: {
      top: '5%',
      bottom: '5%',
    },
    xAxis: {
      type: 'category',
      data: xAxisCategories,
      axisLine: {
        show: false,
      },
      splitArea: {
        show: false,
      },
      axisLabel: {
        hideOverlap: true,
        formatter: getFormattedStatusHistoryAxisLabel(timeScale?.rangeMs ?? 0, timeZone),
      },
    },
    yAxis: {
      type: 'category',
      data: yAxisCategories,
      axisLine: {
        show: false,
      },
      splitArea: {
        show: false,
        interval: 0,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        interval: 0,
      },
    },
    visualMap: {
      show: false,
      type: 'piecewise',
      pieces: colors,
    },
    series: [
      {
        name: 'Status history',
        type: 'heatmap',
        coordinateSystem: 'cartesian2d',
        data: data,
        label: {
          show: false,
        },
        itemStyle: {
          borderWidth: 1,
          borderType: 'solid',
          borderColor: '#ffffff',
        },
        emphasis: {
          itemStyle: {
            opacity: 0.5,
          },
        },
      },
    ],
  };

  return (
    <Box sx={{ height: height, overflow: 'auto' }}>
      <EChart
        sx={{
          width: '100%',
          height: height,
        }}
        option={option}
        theme={chartsTheme.echartsTheme}
      />
    </Box>
  );
}
