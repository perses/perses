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

import { ThemeOptions as MaterialThemeOptions } from '@mui/material';
import type { EChartsOption, EChartsCoreOption, BarSeriesOption, LineSeriesOption } from 'echarts';
import merge from 'lodash/merge';

export interface PersesChartsTheme {
  themeName: string;
  theme: EChartsTheme;
  noDataOption: EChartsCoreOption;
}

// https://github.com/apache/echarts/issues/12489#issuecomment-643185207
export interface EChartsTheme extends EChartsOption {
  bar?: BarSeriesOption;
  line?: LineSeriesOption;
}

export function generateChartsTheme(
  themeName: string,
  muiTheme?: MaterialThemeOptions,
  echartsTheme?: EChartsTheme
): PersesChartsTheme {
  const ltGrey = muiTheme?.palette?.grey ? muiTheme.palette.grey[300] : '#dee2e6';
  const mdGrey = muiTheme?.palette?.grey ? muiTheme.palette.grey[600] : '#545454';
  const primaryTextColor = muiTheme?.palette?.text?.primary ?? '#222';

  const defaultChartsTheme = {
    title: {
      show: false,
    },
    grid: {
      top: 10,
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
          color: [ltGrey],
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
          opacity: 0.9,
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
      emphasis: {
        iconStyle: {
          textFill: primaryTextColor,
        },
      },
    },
    tooltip: {},
    line: {
      showSymbol: false,
      symbol: 'circle',
      symbolSize: 4,
      smooth: false,
      lineStyle: {
        width: 1.5,
      },
      emphasis: {
        lineStyle: {
          width: 2,
        },
      },
    },
    bar: {
      barMaxWidth: 150,
      itemStyle: {
        barBorderWidth: 0,
        barBorderColor: ltGrey,
      },
    },
  };

  return {
    themeName,
    theme: merge(defaultChartsTheme, echartsTheme),
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
      // series: [],
    },
  };
}
