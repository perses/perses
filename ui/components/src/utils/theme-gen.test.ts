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

import { createTheme } from '@mui/material';
import { EChartsTheme, PersesChartsTheme } from '../model';
import { generateChartsTheme } from './theme-gen';

describe('generateChartsTheme', () => {
  const muiTheme = createTheme({});
  const echartsThemeOverrides: EChartsTheme = {
    legend: {
      textStyle: {
        color: 'yellow',
      },
    },
    line: {
      showSymbol: true,
      smooth: true,
    },
  };
  const chartsTheme: PersesChartsTheme = generateChartsTheme(muiTheme, { echartsTheme: echartsThemeOverrides });

  it('should return perses specific charts theme from converted MUI theme', () => {
    expect(chartsTheme).toMatchInlineSnapshot(`
      {
        "container": {
          "padding": {
            "default": 12,
          },
        },
        "echartsTheme": {
          "axisPointer": {
            "lineStyle": {
              "color": "#9e9e9e",
            },
          },
          "bar": {
            "barMaxWidth": 150,
            "itemStyle": {
              "borderColor": "#e0e0e0",
              "borderRadius": 0,
              "borderWidth": 0,
            },
            "label": {
              "color": "rgba(0, 0, 0, 0.87)",
              "show": false,
            },
          },
          "categoryAxis": {
            "axisLabel": {
              "color": "rgba(0, 0, 0, 0.87)",
              "margin": 15,
              "show": true,
            },
            "axisLine": {
              "lineStyle": {
                "color": "#757575",
              },
              "show": true,
            },
            "axisTick": {
              "length": 6,
              "lineStyle": {
                "color": "#757575",
              },
              "show": false,
            },
            "show": true,
            "splitArea": {
              "areaStyle": {
                "color": [
                  "#e0e0e0",
                ],
              },
              "show": false,
            },
            "splitLine": {
              "lineStyle": {
                "color": "#e0e0e0",
                "opacity": 0.4,
                "width": 0.5,
              },
              "show": true,
            },
          },
          "color": [
            "#56B4E9",
            "#009E73",
            "#0072B2",
            "#CC79A7",
            "#F0E442",
            "#E69F00",
            "#D55E00",
          ],
          "gauge": {
            "detail": {
              "fontSize": 18,
              "fontWeight": 600,
              "valueAnimation": false,
            },
            "splitLine": {
              "distance": 0,
              "length": 4,
              "lineStyle": {
                "width": 1,
              },
            },
            "splitNumber": 12,
          },
          "grid": {
            "bottom": 0,
            "containLabel": true,
            "left": 20,
            "right": 20,
            "top": 5,
          },
          "legend": {
            "orient": "horizontal",
            "pageIconColor": "rgba(0, 0, 0, 0.54)",
            "pageIconInactiveColor": "rgba(0, 0, 0, 0.26)",
            "pageTextStyle": {
              "color": "#757575",
            },
            "textStyle": {
              "color": "yellow",
            },
          },
          "line": {
            "emphasis": {
              "lineStyle": {
                "width": 1.5,
              },
            },
            "lineStyle": {
              "width": 1,
            },
            "showSymbol": true,
            "smooth": true,
            "symbol": "circle",
            "symbolSize": 4,
          },
          "markLine": {
            "itemStyle": {
              "color": "#9e9e9e",
            },
            "lineStyle": {
              "type": "dashed",
              "width": 1,
            },
            "symbol": "none",
            "symbolSize": 0,
          },
          "textStyle": {
            "color": "rgba(0, 0, 0, 0.87)",
            "fontFamily": ""Roboto", "Helvetica", "Arial", sans-serif",
            "fontSize": 12,
          },
          "timeAxis": {
            "axisLabel": {
              "color": "rgba(0, 0, 0, 0.87)",
              "margin": 15,
              "show": true,
            },
            "axisLine": {
              "lineStyle": {
                "color": "#757575",
              },
              "show": true,
            },
            "axisTick": {
              "length": 6,
              "lineStyle": {
                "color": "#757575",
              },
              "show": false,
            },
            "show": true,
            "splitArea": {
              "areaStyle": {
                "color": [
                  "#e0e0e0",
                ],
              },
              "show": false,
            },
            "splitLine": {
              "lineStyle": {
                "color": "#e0e0e0",
                "opacity": 0.4,
                "width": 0.5,
              },
              "show": true,
            },
          },
          "title": {
            "show": false,
          },
          "toolbox": {
            "iconStyle": {
              "borderColor": "rgba(0, 0, 0, 0.87)",
            },
            "right": 10,
            "show": true,
            "top": 10,
          },
          "tooltip": {
            "backgroundColor": undefined,
            "borderColor": undefined,
            "textStyle": {
              "color": "#fff",
              "fontSize": 11,
            },
          },
          "valueAxis": {
            "axisLabel": {
              "color": "rgba(0, 0, 0, 0.87)",
              "margin": 12,
            },
            "axisLine": {
              "show": false,
            },
            "show": true,
            "splitLine": {
              "lineStyle": {
                "color": "#e0e0e0",
                "opacity": 0.6,
                "width": 0.5,
              },
              "show": true,
            },
          },
        },
        "noDataOption": {
          "title": {
            "left": "center",
            "show": true,
            "text": "No data",
            "textStyle": {
              "color": "rgba(0, 0, 0, 0.87)",
              "fontSize": 16,
              "fontWeight": 400,
            },
            "top": "center",
          },
          "xAxis": {
            "show": false,
          },
          "yAxis": {
            "show": false,
          },
        },
        "sparkline": {
          "color": "#1976d2",
          "width": 2,
        },
        "thresholds": {
          "defaultColor": "#2e7d32",
          "palette": [
            "#FFCC00",
            "#ed6c02",
            "#d32f2f",
          ],
        },
      }
    `);
  });
});
