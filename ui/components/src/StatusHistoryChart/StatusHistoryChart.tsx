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

import { Box } from '@mui/material';
import { HeatmapChart as EChartsHeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponentOption,
} from 'echarts/components';
import { EChartsCoreOption, use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { TimeScale } from '@perses-dev/core';
import { useChartsTheme } from '../context/ChartsProvider';
import { useTimeZone } from '../context/TimeZoneProvider';
import { formatWithTimeZone } from '../utils';
import { EChart } from '../EChart';
import { getColorsForValues } from './utils/get-color';
import { getFormattedStatusHistoryAxisLabel } from './get-formatted-axis-label';
import { getTooltipPosition } from './utils/get-tooltip-position';

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

export interface StatusHistoryChartProps {
  height: number;
  data: StatusHistoryData[];
  xAxisCategories: number[];
  yAxisCategories: string[];
  legend?: LegendComponentOption;
  timeScale?: TimeScale;
}

export function StatusHistoryChart(props: StatusHistoryChartProps) {
  const { height, data, xAxisCategories, yAxisCategories, timeScale } = props;
  const { timeZone } = useTimeZone();
  const chartsTheme = useChartsTheme();

  const uniqueValues = [...new Set(data.map((item) => item[2]))].filter(
    (value): value is number => value !== undefined
  );

  // get colors from theme and generate colors if not provided
  const colors = uniqueValues.map((value, index) => ({
    value,
    color: getColorsForValues(
      uniqueValues,
      Array.isArray(chartsTheme.echartsTheme.color)
        ? chartsTheme.echartsTheme.color.filter((color): color is string => typeof color === 'string')
        : []
    )[index],
  }));

  const option: EChartsCoreOption = {
    tooltip: {
      position: getTooltipPosition,
      formatter: (params: { data: StatusHistoryData }) => {
        const { data } = params;
        const [x, y, value] = data;
        const xAxisLabel = xAxisCategories[x];
        const date = xAxisLabel ? new Date(xAxisLabel) : null;
        const time = date ? formatWithTimeZone(date, 'yyyy-MM-dd HH:mm:ss', timeZone) : '';
        return `
              <div style="padding: 5px;">
                  ${time}<br/>
                  <strong>${yAxisCategories[y]}</strong><br/>
                  ${value}<br/>
              </div>
          `;
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
