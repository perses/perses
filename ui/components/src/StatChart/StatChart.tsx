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

import React, { useEffect, useMemo, useState } from 'react';
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

  const [valueSize, setValueSize] = useState<number>(14);
  const [labelSize, setLabelSize] = useState<number>(22);

  // TODO (sjcobb): fix noData condition, pass alternate label as data.name
  const calculatedValue = data.calculatedValue ?? 0;
  const isLargePanel = width > 250 ? true : false;
  const showName = isLargePanel;
  const name = showName === true ? data.name : '';

  useEffect(() => {
    // https://codesandbox.io/s/eager-bell-828f2?file=/src/App.js
    const maxFontSize = 30;
    const dimension = Math.min(width, height * 1.5);
    const spaceForText = dimension / 3;
    const valueFontSize = Math.min(spaceForText, maxFontSize) * 1.8;
    const labelFontSize = Math.min(valueFontSize * 0.333, 30);
    setValueSize(valueFontSize);
    setLabelSize(labelFontSize);
  }, [width, height]);

  const option: EChartsCoreOption = useMemo(() => {
    if (data.seriesData === undefined) return {};
    if (data.seriesData === null) return chartsTheme.noDataOption;

    const series = data.seriesData;

    const statSeries: Array<GaugeSeriesOption | LineSeriesOption> = [];

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
      grid: {
        show: false,
        top: '35%', // adds space above sparkline
        right: 0,
        bottom: 0,
        left: 0,
        containLabel: false,
      },
      xAxis: {
        type: 'time',
        show: false,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      tooltip: {
        show: false,
      },
      series: statSeries,
    };

    return option;
  }, [data, chartsTheme, sparkline, backgroundColor]);

  return (
    <Box>
      <Typography
        variant="h4"
        sx={(theme) => ({
          color: theme.palette.text.primary,
          fontSize: labelSize,
        })}
      >
        {name}
      </Typography>
      <Typography
        variant="h3"
        sx={(theme) => ({
          color: theme.palette.text.primary,
          fontSize: valueSize,
        })}
      >
        {formatValue(calculatedValue, unit)}
      </Typography>
      {sparkline !== undefined && (
        <EChart
          sx={{
            width: width + 32,
            height: height,
            position: 'absolute',
            bottom: 0,
            left: 0,
          }}
          option={option}
          theme={chartsTheme.themeName}
          renderer="svg"
        />
      )}
    </Box>
  );
}
