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

import { Theme } from '@mui/material';
import { merge } from 'lodash-es';
import { EChartsTheme, PersesChartsTheme } from '../model';

const DEFAULT_TEXT_COLOR = '#222';

// avoid component override type errors since only palette and typography are used
type MuiTheme = Omit<Theme, 'components'>;

export function generateChartsTheme(muiTheme: MuiTheme, echartsTheme: EChartsTheme): PersesChartsTheme {
  const primaryTextColor = muiTheme.palette.text?.primary ?? DEFAULT_TEXT_COLOR;

  const muiConvertedTheme: EChartsTheme = {
    title: {
      show: false,
    },
    textStyle: {
      color: primaryTextColor,
      fontFamily: muiTheme.typography.fontFamily,
      fontSize: 12,
    },
    grid: {
      top: 5,
      right: 20,
      bottom: 0,
      left: 20,
      containLabel: true,
    },
    color: ['#8dd3c7', '#fb8072', '#80b1d3', '#bebada', '#fdb462'],
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
          color: muiTheme.palette.grey[600],
        },
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: muiTheme.palette.grey[600],
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          width: 0.5,
          color: muiTheme.palette.grey[300],
          opacity: 0.6,
        },
      },
      splitArea: {
        show: false,
        areaStyle: {
          color: [muiTheme.palette.grey[300]],
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
          color: muiTheme.palette.grey[300],
          opacity: 0.6,
        },
      },
    },
    legend: {
      orient: 'horizontal',
      textStyle: {
        color: primaryTextColor,
      },
      pageTextStyle: {
        color: muiTheme.palette.grey[600],
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
        borderColor: muiTheme.palette.grey[300],
      },
    },
    gauge: {
      detail: {
        fontSize: 18,
        fontWeight: 600,
        valueAnimation: false,
      },
      splitLine: {
        distance: 0,
        length: 4,
        lineStyle: {
          width: 1,
        },
      },
      splitNumber: 12,
    },
  };

  return {
    echartsTheme: merge(muiConvertedTheme, echartsTheme),
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
    sparkline: {
      width: 2,
      color: '#1976d2',
    },
    container: {
      padding: {
        default: parseInt(muiTheme.spacing(1.5), 10),
      },
    },
    thresholds: {
      defaultColor: muiTheme.palette.success.main,
      palette: ['#FFCC00', muiTheme.palette.warning.main, muiTheme.palette.error.main],
    },
  };
}
