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
import { Box, Typography, styled } from '@mui/material';
import merge from 'lodash/merge';
import { use, EChartsCoreOption } from 'echarts/core';
import { LineChart as EChartsLineChart, LineSeriesOption } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { formatValue, UnitOptions } from '../model/units';
import { EChart } from '../EChart';
import { GraphSeries } from '../model/graph';
import { calculateFontSize } from './calculateFontSize';

use([EChartsLineChart, GridComponent, DatasetComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

const LINE_HEIGHT = 1.2;
const SERIES_NAME_MAX_FONT_SIZE = 30;
const SERIES_NAME_HEIGHT_RATIO = 0.125;

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
  showSeriesName?: boolean;
}

export function StatChart(props: StatChartProps) {
  const { width, height, data, unit, color, sparkline, showSeriesName } = props;
  const chartsTheme = useChartsTheme();
  const formattedValue = data.calculatedValue === undefined ? '' : formatValue(data.calculatedValue, unit);

  const containerPadding = chartsTheme.container.padding.default;

  // calculate series name font size and height
  let seriesNameFontSize = calculateFontSize({
    text: data?.seriesData?.name ?? '',
    width,
    height: height * SERIES_NAME_HEIGHT_RATIO,
    maxSize: SERIES_NAME_MAX_FONT_SIZE,
    fontWeight: 400,
  });
  const seriesNameHeight = showSeriesName ? seriesNameFontSize * LINE_HEIGHT + containerPadding : 0;

  // calculate value font size and height
  const valueFontSize = calculateFontSize({
    text: formattedValue,
    fontWeight: 700,
    width: sparkline ? width : width * 0.5,
    height: sparkline ? height * 0.25 : (height - seriesNameHeight) * 0.9,
  });
  const valueFontHeight = valueFontSize * LINE_HEIGHT;

  // make sure the series name font size is slightly smaller than value font size
  seriesNameFontSize = Math.min(valueFontSize * 0.7, seriesNameFontSize);

  const option: EChartsCoreOption = useMemo(() => {
    if (data.seriesData === undefined) return chartsTheme.noDataOption;

    const series = data.seriesData;
    const statSeries: LineSeriesOption[] = [];

    if (sparkline !== undefined) {
      const lineSeries = {
        type: 'line',
        name: series.name,
        data: series.values,
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

  const textAlignment = sparkline ? 'auto' : 'center';
  const textStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: textAlignment,
    alignItems: textAlignment,
  };

  return (
    <Box sx={{ height: '100%', width: '100%', ...textStyles }}>
      {showSeriesName && (
        <SeriesName padding={containerPadding} fontSize={seriesNameFontSize}>
          {data.seriesData?.name}
        </SeriesName>
      )}
      <Value variant="h3" color={color} fontSize={valueFontSize} padding={containerPadding}>
        {formattedValue}
      </Value>
      {sparkline !== undefined && (
        <EChart
          sx={{
            width: '100%',
            height: height - seriesNameHeight - valueFontHeight,
          }}
          option={option}
          theme={chartsTheme.echartsTheme}
          renderer="svg"
        />
      )}
    </Box>
  );
}

const SeriesName = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'padding' && prop !== 'fontSize',
})<{ padding?: number; fontSize?: number; textAlignment?: string }>(({ theme, padding, fontSize }) => ({
  color: theme.palette.text.secondary,
  padding: `${padding}px`,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: `${fontSize}px`,
}));

const Value = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'color' && prop !== 'padding' && prop !== 'fontSize' && prop !== 'sparkline',
})<{ color?: string; padding?: number; fontSize?: number; sparkline?: boolean }>(
  ({ theme, color, padding, fontSize, sparkline }) => ({
    color: color ?? theme.palette.text.primary,
    fontSize: `${fontSize}px`,
    padding: sparkline ? `${padding}px ${padding}px 0 ${padding}px` : ` 0 ${padding}px`,
    whiteSpace: 'nowrap',
    lineHeight: LINE_HEIGHT,
  })
);
