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

import { EChart, useChartsTheme } from '@perses-dev/components';
import { use, EChartsCoreOption } from 'echarts/core';
import { ScatterChart as EChartsScatterChart } from 'echarts/charts';
import {
  DatasetComponent,
  DataZoomComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsOption } from 'echarts';

use([
  DatasetComponent,
  DataZoomComponent,
  LegendComponent,
  EChartsScatterChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

interface ScatterplotProps {
  width: number;
  height: number;
  options: EChartsOption;
}

export function Scatterplot(props: ScatterplotProps) {
  const { width, height, options } = props;
  const chartsTheme = useChartsTheme();

  // Apache EChart Options Docs: https://echarts.apache.org/en/option.html
  const eChartOptions: EChartsCoreOption = {
    dataset: options.dataset,
    series: options.series,
    dataZoom: options.dataZoom,
    grid: {
      bottom: 40,
      top: 50,
      left: 50,
      right: 100,
    },
    xAxis: {
      type: 'time',
      name: 'Local Time',
    },
    yAxis: {
      scale: true,
      type: 'value',
      name: 'Duration',
      axisLabel: {
        formatter: '{value} ms',
      },
    },
    animation: false,
    tooltip: {
      padding: 5,
      borderWidth: 1,
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: function (params: any) {
        // TODO: import type from ECharts instead of using any
        params = params[0];
        return [
          '<b>time</b>: ' + params.data.startTime + '<br/>',
          '<b>duration (miliseconds)</b>: ' + params.data.durationMs + '<br/>',
          '<b>spanCount</b>: ' + params.data.spanCount + '<br/>',
          '<b>errorCount</b>: ' + params.data.errorCount + '<br/>',
          '<b>name</b>: ' + params.data.name + '<br/>',
        ].join('');
      },
    },
    legend: {
      show: true,
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0,
    },
  };

  return (
    <EChart
      sx={{
        width: width,
        height: height,
      }}
      option={eChartOptions}
      theme={chartsTheme.echartsTheme}
    />
  );
}
