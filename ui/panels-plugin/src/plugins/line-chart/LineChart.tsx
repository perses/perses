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

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { LineChart as EChartsLineChart } from 'echarts/charts';
import { GridComponent, DatasetComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useMemo } from 'react';
import { useRunningTimeSeriesQueries } from './TimeSeriesQueryRunner';

echarts.use([
  EChartsLineChart,
  GridComponent,
  DatasetComponent,
  CanvasRenderer,
]);

export interface LineChartProps {
  width: number;
  height: number;
}

function LineChart(props: LineChartProps) {
  const { width, height } = props;
  const queries = useRunningTimeSeriesQueries();

  const option: EChartsOption = useMemo(() => {
    const dataset: EChartsOption['dataset'] = [];
    const series: EChartsOption['series'] = [];

    for (const query of queries) {
      if (query.loading || query.data === undefined) continue;

      for (const dataSeries of query.data.series) {
        dataset.push({
          source: [['timestamp', 'value'], ...dataSeries.values],
        });

        series.push({
          type: 'line',
        });
      }
    }

    return {
      dataset,
      series,
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value',
      },
    };
  }, [queries]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ width, height }}
      opts={{ width, height }}
    />
  );
}

export default LineChart;
