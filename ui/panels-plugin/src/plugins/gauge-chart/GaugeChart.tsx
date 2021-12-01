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

import { AnyGraphQueryDefinition, useGraphQuery } from '@perses-ui/core';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { GaugeChart as EChartsGaugeChart } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { CalculationsMap, CalculationType } from '../../model/calculations';
import { formatValue, UnitOptions } from '../../model/units';
import { convertThresholds, defaultThresholdInput, ThresholdOptions } from './thresholds';

echarts.use([EChartsGaugeChart, GridComponent, DatasetComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

export interface GaugeChartProps {
  query: AnyGraphQueryDefinition;
  width: number;
  height: number;
  calculation: CalculationType;
  unit: UnitOptions;
  thresholds?: ThresholdOptions;
}

const noDataOption = {
  title: {
    show: true,
    textStyle: {
      color: 'grey',
      fontSize: 20,
    },
    text: 'No data',
    left: 'center',
    top: 'center',
  },
  xAxis: {
    show: false,
  },
  yAxis: {
    show: false,
  },
  series: [],
};

function GaugeChart(props: GaugeChartProps) {
  const { query, width, height, calculation, unit } = props;
  const thresholds = props.thresholds ?? defaultThresholdInput;
  const { data } = useGraphQuery(query);

  const option: EChartsOption = useMemo(() => {
    // TODO (sjcobb): add loading spinner, share noDataOption with other charts
    if (data === undefined) return {};

    const series = Array.from(data.series)[0];
    if (series === undefined) return noDataOption;

    const calculate = CalculationsMap[calculation];
    const calculatedValue = calculate(Array.from(series.values)) ?? 0;

    const axisLineColors = convertThresholds(thresholds);

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
          radius: '100%',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 12,
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
            distance: -28,
            splitNumber: 5,
            lineStyle: {
              width: 2,
              color: '#999',
            },
          },
          splitLine: {
            show: false,
            distance: -32,
            length: 6,
            lineStyle: {
              width: 2,
              color: '#999',
            },
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
          radius: '114%',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          pointer: {
            show: false,
            itemStyle: {
              color: 'auto',
            },
          },
          axisLine: {
            show: true,
            lineStyle: {
              width: 5,
              color: axisLineColors,
            },
          },
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
            valueAnimation: false,
            width: '60%',
            borderRadius: 8,
            offsetCenter: [0, '-9%'],
            fontSize: 20,
            fontWeight: 'bolder',
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
            },
          ],
        },
      ],
    };
  }, [data, calculation, unit, thresholds]);

  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<echarts.ECharts | undefined>(undefined);

  // Create a chart instance in the container
  useLayoutEffect(() => {
    if (containerRef === null) return;

    // TODO (sjcobb): add echarts wrapper, common way to init echarts
    const chart = echarts.init(containerRef);
    setChart(chart);

    return () => {
      chart.dispose();
    };
  }, [containerRef]);

  // Sync options with chart instance
  useLayoutEffect(() => {
    // Can't set options if no chart yet
    if (chart === undefined) return;

    chart.setOption(option);
  }, [chart, option]);

  // Resize the chart to match as width/height changes
  const prevSize = useRef({ width, height });
  useLayoutEffect(() => {
    // No need to resize initially
    if (prevSize.current.width === width && prevSize.current.height === height) {
      return;
    }

    // Can't resize if no chart yet
    if (chart === undefined) return;

    chart.resize({ width, height });
    prevSize.current = { width, height };
  }, [chart, width, height]);

  return <Box ref={setContainerRef} sx={{ width, height }}></Box>;
}

export default GaugeChart;
