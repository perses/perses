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

import React from 'react';
import { useTheme, ThemeOptions as MaterialThemeOptions } from '@mui/material';
import merge from 'lodash/merge';
import { EChartsTheme, PersesChartsTheme } from '../model';
import { ChartsThemeProvider } from './ChartsThemeProvider';

export interface PersesThemeProviderProps {
  themeName: string;
  muiTheme?: MaterialThemeOptions;
  themeOverrides?: EChartsTheme;
  children?: React.ReactNode;
}

export function PersesThemeProvider(props: PersesThemeProviderProps) {
  const { children, themeName, themeOverrides } = props;
  const muiTheme = useTheme();

  const ltGrey = muiTheme.palette.grey[300] ?? '#dee2e6';
  const mdGrey = muiTheme.palette.grey[600] ?? '#545454';
  const primaryTextColor = muiTheme.palette.text.primary ?? '#222';
  const primaryFontFamily = muiTheme.typography.fontFamily ?? '"Lato", sans-serif';

  const echartsTheme: EChartsTheme = {
    title: {
      show: false,
    },
    textStyle: {
      color: primaryTextColor,
      fontFamily: primaryFontFamily,
      fontSize: 12,
    },
    grid: {
      top: 5,
      right: 20,
      bottom: 0,
      left: 20,
      containLabel: true,
    },
    color: ['#8dd3c7', '#bebada', '#fb8072', '#80b1d3', '#fdb462'],
    categoryAxis: {
      show: true,
      axisLabel: {
        show: true,
        color: primaryTextColor,
        margin: 15,
      },
      axisTick: {
        show: false,
        length: 6,
        lineStyle: {
          color: mdGrey,
        },
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: mdGrey,
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          width: 0.5,
          color: ltGrey,
          opacity: 0.6,
        },
      },
      splitArea: {
        show: false,
        areaStyle: {
          color: [ltGrey],
        },
      },
    },
    valueAxis: {
      show: true,
      axisLabel: {
        color: primaryTextColor,
        margin: 12,
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        show: true,
        lineStyle: {
          width: 0.5,
          color: ltGrey,
          opacity: 0.6,
        },
      },
    },
    legend: {
      show: false,
      type: 'scroll',
      bottom: 0,
      textStyle: {
        color: primaryTextColor,
      },
      pageTextStyle: {
        color: mdGrey,
      },
      pageIconColor: muiTheme?.palette?.action?.active,
      pageIconInactiveColor: muiTheme?.palette?.action?.disabled,
    },
    toolbox: {
      show: true,
      top: 10,
      right: 10,
      iconStyle: {
        borderColor: primaryTextColor,
      },
    },
    tooltip: {},
    line: {
      showSymbol: false,
      symbol: 'circle',
      symbolSize: 4,
      smooth: false,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
    },
    bar: {
      barMaxWidth: 150,
      itemStyle: {
        borderWidth: 0,
        borderColor: ltGrey,
      },
    },
    gauge: {
      detail: {
        fontSize: 18,
        fontWeight: 600,
        valueAnimation: false,
      },
      splitLine: {
        splitNumber: 2,
        distance: 0,
        length: 4,
        lineStyle: {
          width: 1,
        },
      },
    },
  };

  const persesTheme: PersesChartsTheme = {
    themeName,
    theme: merge(echartsTheme, themeOverrides),
    noDataOption: {
      title: {
        show: true,
        textStyle: {
          color: primaryTextColor,
          fontSize: 16,
          fontWeight: 400,
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
    },
  };

  return (
    <ChartsThemeProvider themeName={themeName} persesTheme={persesTheme}>
      {children}
    </ChartsThemeProvider>
  );
}
