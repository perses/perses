// Copyright 2022 The Perses Authors
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
import { Box, Typography } from '@mui/material';
import { merge } from 'lodash-es';
import { use, EChartsCoreOption } from 'echarts/core';
import { GaugeChart as EChartsGaugeChart, GaugeSeriesOption } from 'echarts/charts';
import { LineChart as EChartsLineChart, LineSeriesOption } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { formatValue, UnitOptions } from '../model/units';
import { EChart } from '../EChart';
import { GraphSeriesValueTuple } from '../model/graph';

use([
  EChartsGaugeChart,
  EChartsLineChart,
  GridComponent,
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export interface GraphSeries {
  name: string;
  values: Iterable<GraphSeriesValueTuple>;
}

export interface StatChartData {
  calculatedValue: number | null | undefined;
  seriesData: GraphSeries | null | undefined;
  name?: string;
}

interface StatChartProps {
  width: number;
  height: number;
  data: StatChartData;
  unit: UnitOptions;
  backgroundColor?: string;
  sparkline?: LineSeriesOption;
}

export function StatChart(props: StatChartProps) {
  const { width, height, data, unit, backgroundColor, sparkline } = props;
  const chartsTheme = useChartsTheme();

  const calculatedValue = data.calculatedValue ?? 0;
  const isLargePanel = width > 250 ? true : false;
  const showName = isLargePanel;
  const name = showName === true ? data.name : '';
  // const smallestSide = Math.min(width, height * 1.2);
  // const baseFontSize = Math.min((smallestSide / 4) * 0.65, 72);
  // const nameFontSize = baseFontSize * 0.5;

  const option: EChartsCoreOption = useMemo(() => {
    if (data.seriesData === undefined) return {};
    if (data.seriesData === null) return chartsTheme.noDataOption;

    const series = data.seriesData;

    const statSeries: Array<GaugeSeriesOption | LineSeriesOption> = [
      {
        type: 'gauge',
        data: [
          // {
          //   value: calculatedValue,
          //   name: name,
          // },
        ],
        detail: {
          // show: true,
          show: false,
          offsetCenter: ['0%', '-65%'],
          formatter: '',
          // formatter: [`{name|${name}}`, `{value|${formatValue(calculatedValue, unit)}}`].join('\n'),
          // rich: {
          //   name: {
          //     padding: showName === true ? [0, 0, 5, 0] : 0,
          //     fontSize: nameFontSize,
          //     lineHeight: nameFontSize * 2.5,
          //     fontWeight: 500,
          //   },
          //   value: {},
          // },
        },
        center: ['50%', '60%'],
        animation: false,
        silent: true,
        title: { show: false },
        progress: { show: false },
        pointer: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        zlevel: 2,
      },
    ];

    if (sparkline !== undefined) {
      const lineSeries: LineSeriesOption = {
        type: 'line',
        data: [...series.values],
        zlevel: 1,
        symbol: 'none',
        animation: false,
        lineStyle: {
          color: backgroundColor,
          opacity: 0.9,
        },
        areaStyle: {
          color: backgroundColor,
          opacity: 0.8,
        },
        silent: true,
      };
      const mergedSeries = merge(lineSeries, sparkline);
      statSeries.push(mergedSeries);
    }

    const option = {
      title: {
        show: false,
      },
      grid: [
        {
          // show: true,
          show: false,
          backgroundColor: backgroundColor,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          containLabel: false,
          borderWidth: 0,
        },
        {
          show: false,
          top: '45%', // adds space above sparkline
          right: 0,
          bottom: 0,
          left: 0,
          containLabel: false,
        },
      ],
      xAxis: {
        type: 'time',
        show: false,
        boundaryGap: false,
        gridIndex: 1, // sparkline grid
      },
      yAxis: {
        type: 'value',
        show: false,
        gridIndex: 1,
      },
      tooltip: {
        show: false,
      },
      series: statSeries,
      // textStyle: {
      //   color: backgroundColor === 'transparent' ? chartsTheme.theme.textStyle?.color : '#FFFFFF',
      //   fontSize: 25,
      //   lineHeight: 18,
      //   fontFamily: '"Lato", sans-serif',
      //   fontWeight: 600,
      // },
      // media: [
      //   {
      //     query: {
      //       maxWidth: 150,
      //     },
      //     option: {
      //       textStyle: {
      //         fontSize: 12,
      //       },
      //     },
      //   },
      //   {
      //     query: {
      //       minWidth: 150,
      //     },
      //     option: {
      //       textStyle: {
      //         fontSize: Math.max(14, baseFontSize),
      //         lineHeight: Math.min(16, baseFontSize * 1.2),
      //       },
      //     },
      //   },
      // ],
    };

    return option;
  }, [data, chartsTheme, sparkline, backgroundColor]);
  // }, [data, height, chartsTheme, unit, width, sparkline, backgroundColor]);

  return (
    <Box>
      <Typography
        variant="h4"
        sx={(theme) => ({
          color: theme.palette.text.primary,
          // fontSize: nameFontSize,
          // lineHeight: Math.min(16, baseFontSize * 1.2),
          // position: 'absolute',
          // top: 10,
          // left: 20,
          // right: 0,
          zIndex: 1,
        })}
      >
        {name}
      </Typography>
      <Typography
        variant="h3"
        sx={(theme) => ({
          // color: theme.palette.text.primary,
          color: theme.palette.common.black,
          // fontSize: Math.max(14, baseFontSize),
          // lineHeight: Math.min(16, baseFontSize * 1.2),
          // position: 'absolute',
          // top: 30,
          // left: 20,
          right: 0,
          zIndex: 1,
        })}
      >
        {formatValue(calculatedValue, unit)}
      </Typography>
      <EChart
        sx={{
          width: width,
          height: height,
        }}
        option={option}
        theme={chartsTheme.themeName}
        renderer="svg"
      />
    </Box>
  );
}
