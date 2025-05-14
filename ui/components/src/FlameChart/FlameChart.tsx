// Copyright 2025 The Perses Authors
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

// import { use } from 'echarts/core';
import {
  CustomSeriesRenderItem,
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemReturn,
} from 'echarts';
import * as echarts from 'echarts';
// import { CanvasRenderer } from 'echarts/renderers';
import { Box } from '@mui/material';
import { ReactElement } from 'react';
import { StackTrace } from '@perses-dev/core';
import { useChartsTheme } from '../context/ChartsProvider';
import { EChart } from '../EChart';

const ITEM_GAP = 2; // vertical gap between flame chart levels (lines)
const MARGIN_TOP = 15; // margin from the top of the flame chart container

export interface FlameChartData {
  stackTrace: StackTrace;
}

export interface FlameChartProps {
  width: number;
  height: number;
  data: FlameChartData;
}

interface Sample {
  name: number;
  // [level, start_val, end_val, name, percentage]
  value: Array<string | number>;
  itemStyle: {
    color: string;
  };
}

export function FlameChart(props: FlameChartProps): ReactElement {
  const { width, height, data } = props;
  const chartsTheme = useChartsTheme();

  // convert number | string to number
  const toNum = (value: string | number | undefined): number => {
    if (value === undefined) {
      return 0;
    }
    return +value;
  };

  const ColorTypes: string[] = [
    '#d95850', // genunix (rouge foncé)
    '#b5c334', // lofs (vert olive)
    '#1bca93', // zfs (vert émeraude)
    '#ffb248', // ufs (orange)
    '#f2d643', // FSS (jaune doré)
    '#fcce10', // doorfs (jaune vif)
    '#eb8146', // unix (orange clair)
    '#ebdba4', // namefs (beige)
    '#8fd3e8', // root (bleu clair)
    '#8fd3e8', // new (bleu marine)
  ];

  // fonction qui retourne une couleur en fonction de la plage de valeurs dans laquelle
  // se trouve la valeur du %, des plages de 10 par exemple.
  const getColorType = (value: number): string => {
    const index = Math.min(Math.floor(value / 10), ColorTypes.length - 1);
    return ColorTypes[index] || '#d3d3d3';
  };

  const filterJson = (json: StackTrace, id?: number): StackTrace => {
    if (id === null) {
      return json;
    }

    const recur = (item: StackTrace, id?: number): StackTrace | undefined => {
      if (item.id === id) {
        return item;
      }

      for (const child of item.children || []) {
        const temp = recur(child, id);
        if (temp) {
          item.children = [temp];

          // change the parents' values (todo : verify this)
          item.start = temp.start;
          item.end = temp.end;
          item.self = temp.self;
          item.total = temp.total;

          return item;
        }
      }
    };

    return recur(json, id) || json;
  };

  const recursionJson = (jsonObj: StackTrace, id?: number): Sample[] => {
    //console.log('data in perses : ', jsonObj);
    const data: Sample[] = [];
    const filteredJson = filterJson(structuredClone(jsonObj), id);

    const rootVal = filteredJson.total; // total samples of root node

    const recur = (item: StackTrace): void => {
      const temp = {
        name: item.id,
        // [level, start_val, end_val, name, percentage]
        value: [item.level, item.start, item.end, item.name, (item.total / rootVal) * 100],
        itemStyle: {
          color: getColorType((item.total / rootVal) * 100),
        },
      };
      data.push(temp);

      for (const child of item.children || []) {
        recur(child);
      }
    };

    recur(filteredJson);
    console.log('data in perses :', data);
    return data;
  };

  const heightOfJson = (json: StackTrace): number => {
    const recur = (item: StackTrace): number => {
      if ((item.children || []).length === 0) {
        return item.level;
      }

      let maxLevel = item.level;
      for (const child of item.children!) {
        const tempLevel = recur(child);
        maxLevel = Math.max(maxLevel, tempLevel);
      }
      return maxLevel;
    };

    return recur(json);
  };

  const renderItem: CustomSeriesRenderItem = (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) => {
    const level = api.value(0);
    const start = api.coord([api.value(1), level]);
    const end = api.coord([api.value(2), level]);
    const height = (((api.size && api.size([0, 1])) || [0, 20]) as number[])[1];
    const width = (end?.[0] ?? 0) - (start?.[0] ?? 0);

    return {
      type: 'rect',
      transition: ['shape'],
      shape: {
        x: start[0],
        y: (start?.[1] ?? 0) - (height ?? 0) / 2 + MARGIN_TOP,
        width,
        height: (height ?? ITEM_GAP) - ITEM_GAP,
        r: 0,
      },
      style: {
        fill: api.visual('color'),
      },
      emphasis: {
        style: {
          stroke: '#000',
        },
      },
      textConfig: {
        position: 'insideLeft',
      },
      textContent: {
        style: {
          text: api.value(3),
          fontFamily: 'Verdana',
          fill: '#000',
          width: width - 4,
          overflow: 'truncate',
          ellipsis: '..',
          truncateMinChar: 1,
        },
        emphasis: {
          style: {
            stroke: '#000',
            lineWidth: 0.5,
          },
        },
      },
    } as CustomSeriesRenderItemReturn;
  };

  const levelOfOriginalJson = heightOfJson(data.stackTrace);

  const option = {
    title: [
      {
        text: 'Flame Graph',
        left: 'center',
        top: 10,
        textStyle: {
          fontFamily: 'Verdana',
          fontWeight: 'normal',
          fontSize: 20,
        },
      },
    ],
    tooltip: {
      // todo : complete the tooltip
      formatter: (params: Sample): string => {
        const samples = toNum(params.value[2]) - toNum(params.value[1]);
        return `${params.value[3]}: (${echarts.format.addCommas(
          samples
        )} samples, ${toNum(params.value[4]).toFixed(2)}%)`;
      },
    },

    xAxis: {
      show: false,
    },
    yAxis: {
      show: false,
      max: levelOfOriginalJson,
      inverse: true, // Inverse l'axe Y
    },
    axisLabel: {
      overflow: 'truncate',
      width: width / 3,
    },
    series: [
      {
        type: 'custom',
        renderItem,
        encode: {
          x: [0, 1, 2],
          y: 0,
        },
        data: recursionJson(data.stackTrace),
      },
    ],
  };

  return (
    <Box
      style={{
        width: width,
        height: height,
      }}
    >
      <EChart
        sx={{
          width: '100%',
          height: '100%',
        }}
        option={option} // even data is in this prop
        theme={chartsTheme.echartsTheme}
      />
    </Box>
  );
}
