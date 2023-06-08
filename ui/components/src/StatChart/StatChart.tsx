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
import { Box, Typography } from '@mui/material';
import merge from 'lodash/merge';
import { use, EChartsCoreOption } from 'echarts/core';
import { LineChart as EChartsLineChart, LineSeriesOption } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { formatValue, UnitOptions } from '../model/units';
import { EChart } from '../EChart';
import { GraphSeries } from '../model/graph';

use([EChartsLineChart, GridComponent, DatasetComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

const MIN_VALUE_SIZE = 12;
const MAX_VALUE_SIZE = 36;

export interface StatChartData {
  calculatedValue?: number;
  seriesData?: GraphSeries;
}

export interface StatChartProps {
  width: number;
  height: number;
  data: StatChartData;
  unit: UnitOptions;
  color?: string;
  sparkline?: LineSeriesOption;
}

export function StatChart(props: StatChartProps) {
  const { width, height, data, unit, color, sparkline } = props;
  const chartsTheme = useChartsTheme();

  const formattedValue = data.calculatedValue === undefined ? '' : formatValue(data.calculatedValue, unit);

  const option: EChartsCoreOption = useMemo(() => {
    if (data.seriesData === undefined) return chartsTheme.noDataOption;

    const series = data.seriesData;
    const statSeries: LineSeriesOption[] = [];

    if (sparkline !== undefined) {
      const lineSeries = {
        type: 'line',
        data: [...series.values],
        zlevel: 1,
        symbol: 'none',
        animation: false,
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
        min: (value: { min: number; max: number }) => {
          if (value.min >= 0 && value.min <= 1) {
            // helps with PercentDecimal units, or datasets that return 0 or 1 booleans
            return 0;
          }
          return value.min;
        },
      },
      tooltip: {
        show: false,
      },
      series: statSeries,
    };

    return option;
  }, [data, chartsTheme, sparkline]);

  const isLargePanel = width > 250 && height > 180;
  // adjusts fontSize depending on number of characters, clamp also used in fontSize attribute
  const charactersAdjust = formattedValue.length;
  const valueSize = isLargePanel === true ? MAX_VALUE_SIZE : Math.min(width, height) / charactersAdjust;

  const containerPadding = `${chartsTheme.container.padding.default}px`;

  const textAlignment = sparkline ? 'auto' : 'center';
  const textStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: textAlignment,
    alignItems: textAlignment,
  };

  return (
    <Box sx={{ height: '100%', width: '100%', ...textStyles }}>
      <Typography
        variant="h3"
        sx={(theme) => ({
          color: color ?? theme.palette.text.primary,
          fontSize: `clamp(${MIN_VALUE_SIZE}px, ${valueSize}px, ${MAX_VALUE_SIZE}px)`,
          padding: sparkline
            ? `${containerPadding} ${containerPadding} 0 ${containerPadding}`
            : ` 0 ${containerPadding}`,
        })}
      >
        {formattedValue}
      </Typography>
      {sparkline !== undefined && (
        <EChart
          sx={{
            width: '100%',
            height: '100%',
          }}
          option={option}
          theme={chartsTheme.echartsTheme}
          renderer="svg"
        />
      )}
    </Box>
  );
}
