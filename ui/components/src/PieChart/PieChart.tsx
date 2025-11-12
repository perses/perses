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

import { use, EChartsCoreOption } from 'echarts/core';
import { PieChart as EChartsPieChart } from 'echarts/charts';
import {
  GridComponent,
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponentOption,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Box } from '@mui/material';
import { ReactElement } from 'react';
import type { ECharts as EChartsInstance } from 'echarts/core';
import { useChartsTheme } from '../context/ChartsProvider';
// LOGZ.IO CHANGE:: Tooltip is not behaving correctly [APPZ-1418]
import { EChart, OnEventsType } from '../EChart';
use([EChartsPieChart, GridComponent, DatasetComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

const PIE_WIN_WIDTH = 12;
const PIE_GAP = 4;
export interface PieChartData {
  name: string;
  value: number | null;
}

export interface PieChartProps {
  width: number;
  height: number;
  data: PieChartData[] | null;
  label?: string;
  legend?: LegendComponentOption;
  // LOGZ.IO CHANGE START:: APPZ-1218 US2 – Pie Chart
  useDefaultTooltip?: boolean;
  _instance?: React.MutableRefObject<EChartsInstance | undefined>;
  onEvents?: OnEventsType<unknown>;
  // LOGZ.IO CHANGE END:: APPZ-1218 US2 – Pie Chart
}

export function PieChart(props: PieChartProps): ReactElement {
  const {
    width,
    height,
    data,
    label,
    // LOGZ.IO CHANGE START:: APPZ-1218 US2 – Pie Chart
    _instance,
    useDefaultTooltip = true,
    onEvents,
    // LOGZ.IO CHANGE END:: APPZ-1218 US2 – Pie Chart
  } = props;
  const chartsTheme = useChartsTheme();

  const option: EChartsCoreOption = {
    // LOGZ.IO CHANGE: APPZ-1218 US2 – Pie Chart
    tooltip: useDefaultTooltip
      ? {
          trigger: 'item',
          formatter: label ? '{a} <br/>{b} : {c} ({d}%)' : '{b} : {c} ({d}%)',
        }
      : undefined,
    axisLabel: {
      overflow: 'truncate',
      width: width / 3,
    },
    series: [
      {
        name: label ?? '-',
        type: 'pie',
        radius: '55%',
        label: false,
        center: ['40%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
    itemStyle: {
      borderRadius: 2,
      color: chartsTheme.echartsTheme[0],
    },
  };

  return (
    <Box
      style={{
        width: width,
        height: height,
      }}
      sx={{ overflow: 'auto' }}
    >
      <EChart
        sx={{
          minHeight: height,
          height: data ? data.length * (PIE_WIN_WIDTH + PIE_GAP) : '100%',
        }}
        option={option}
        theme={chartsTheme.echartsTheme}
        // LOGZ.IO CHANGE START:: APPZ-1218 US2 – Pie Chart
        _instance={_instance}
        onEvents={onEvents}
        // LOGZ.IO CHANGE END:: APPZ-1218 US2 – Pie Chart
      />
    </Box>
  );
}
