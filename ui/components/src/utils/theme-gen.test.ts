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
  const chartsTheme: PersesChartsTheme = generateChartsTheme(muiTheme, echartsThemeOverrides);

  it('should return perses specific charts theme from converted MUI theme', () => {
    expect(chartsTheme).toMatchInlineSnapshot(`
      Object {
        "echartsTheme": Object {
          "bar": Object {
            "barMaxWidth": 150,
            "itemStyle": Object {
              "borderColor": "#e0e0e0",
              "borderWidth": 0,
            },
          },
          "categoryAxis": Object {
            "axisLabel": Object {
              "color": "rgba(0, 0, 0, 0.87)",
              "margin": 15,
              "show": true,
            },
            "axisLine": Object {
              "lineStyle": Object {
                "color": "#757575",
              },
              "show": true,
            },
            "axisTick": Object {
              "length": 6,
              "lineStyle": Object {
                "color": "#757575",
              },
              "show": false,
            },
            "show": true,
            "splitArea": Object {
              "areaStyle": Object {
                "color": Array [
                  "#e0e0e0",
                ],
              },
              "show": false,
            },
            "splitLine": Object {
              "lineStyle": Object {
                "color": "#e0e0e0",
                "opacity": 0.6,
                "width": 0.5,
              },
              "show": true,
            },
          },
          "color": Array [
            "#8dd3c7",
            "#bebada",
            "#fb8072",
            "#80b1d3",
            "#fdb462",
          ],
          "gauge": Object {
            "detail": Object {
              "fontSize": 18,
              "fontWeight": 600,
              "valueAnimation": false,
            },
            "splitLine": Object {
              "distance": 0,
              "length": 4,
              "lineStyle": Object {
                "width": 1,
              },
            },
            "splitNumber": 12,
          },
          "grid": Object {
            "bottom": 0,
            "containLabel": true,
            "left": 20,
            "right": 20,
            "top": 5,
          },
          "legend": Object {
            "orient": "horizontal",
            "pageIconColor": "rgba(0, 0, 0, 0.54)",
            "pageIconInactiveColor": "rgba(0, 0, 0, 0.26)",
            "pageTextStyle": Object {
              "color": "#757575",
            },
            "textStyle": Object {
              "color": "yellow",
            },
          },
          "line": Object {
            "emphasis": Object {
              "lineStyle": Object {
                "width": 1.5,
              },
            },
            "lineStyle": Object {
              "width": 1,
            },
            "showSymbol": true,
            "smooth": true,
            "symbol": "circle",
            "symbolSize": 4,
          },
          "textStyle": Object {
            "color": "rgba(0, 0, 0, 0.87)",
            "fontFamily": "\\"Roboto\\", \\"Helvetica\\", \\"Arial\\", sans-serif",
            "fontSize": 12,
          },
          "title": Object {
            "show": false,
          },
          "toolbox": Object {
            "iconStyle": Object {
              "borderColor": "rgba(0, 0, 0, 0.87)",
            },
            "right": 10,
            "show": true,
            "top": 10,
          },
          "tooltip": Object {},
          "valueAxis": Object {
            "axisLabel": Object {
              "color": "rgba(0, 0, 0, 0.87)",
              "margin": 12,
            },
            "axisLine": Object {
              "show": false,
            },
            "show": true,
            "splitLine": Object {
              "lineStyle": Object {
                "color": "#e0e0e0",
                "opacity": 0.6,
                "width": 0.5,
              },
              "show": true,
            },
          },
        },
        "noDataOption": Object {
          "title": Object {
            "left": "center",
            "show": true,
            "text": "No data",
            "textStyle": Object {
              "color": "rgba(0, 0, 0, 0.87)",
              "fontSize": 16,
              "fontWeight": 400,
            },
            "top": "center",
          },
          "xAxis": Object {
            "show": false,
          },
          "yAxis": Object {
            "show": false,
          },
        },
        "sparkline": Object {
          "color": "#1976d2",
          "width": 2,
        }
      }
    `);
  });
});
