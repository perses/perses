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

import { ReactElement, useMemo } from 'react';
import { EChart, OnEventsType, useChartsTheme } from '@perses-dev/components';
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
import { EChartsOption, ScatterSeriesOption } from 'echarts';
import { formatValue } from '@perses-dev/core';
import { EChartTraceValue } from './ScatterChartPanel';

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

interface ScatterplotProps<T> {
  width: number;
  height: number;
  options: EChartsOption;
  onClick?: (data: T) => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'long',
  timeStyle: 'medium',
}).format;

export function Scatterplot<T>(props: ScatterplotProps<T>): ReactElement {
  const { width, height, options, onClick } = props;
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
        formatter: (durationMs: number) => formatValue(durationMs, { unit: 'milliseconds' }),
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
        const data = params[0].data as EChartTraceValue;
        return [
          `<b>Service name</b>: ${data.rootServiceName}<br/>`,
          `<b>Span name</b>: ${data.rootTraceName}<br/>`,
          `<b>Time</b>: ${DATE_FORMATTER(data.startTime)}<br/>`,
          `<b>Duration</b>: ${formatValue(data.durationMs, { unit: 'milliseconds' })}<br/>`,
          `<b>Span count</b>: ${data.spanCount} (${data.errorCount} errors)<br/>`,
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

  const handleEvents: OnEventsType<ScatterSeriesOption['data'] | unknown> = useMemo(() => {
    const handlers: OnEventsType<ScatterSeriesOption['data'] | unknown> = {};
    if (onClick) {
      handlers.click = (params): void => onClick(params.data as T);
    }
    return handlers;
  }, [onClick]);

  return (
    <EChart
      sx={{
        width: width,
        height: height,
      }}
      option={eChartOptions}
      theme={chartsTheme.echartsTheme}
      onEvents={handleEvents}
    />
  );
}
