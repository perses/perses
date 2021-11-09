// Copyright 2021 The Perses Authors
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

import {
  AnyGraphQueryDefinition,
  JsonObject,
  PanelProps,
  usePanelState,
} from '@perses-ui/core';
import { useMemo } from 'react';
import LineChart from './LineChart';
import GraphQueryRunner from './GraphQueryRunner';
import UPlotChart from './uplot/UPlotChart';

export const LineChartKind = 'LineChart' as const;

export type LineChartProps = PanelProps<typeof LineChartKind, LineChartOptions>;

interface LineChartOptions extends JsonObject {
  queries: AnyGraphQueryDefinition[];
  show_legend?: boolean;
}

export function LineChartPanel(props: LineChartProps) {
  const {
    definition: {
      options: { queries },
    },
  } = props;
  const { contentDimensions } = usePanelState();

  const isUPlot = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('uplot') === 'true';
  }, []);

  const Chart = isUPlot ? UPlotChart : LineChart;

  return (
    <GraphQueryRunner queries={queries}>
      {contentDimensions !== undefined && (
        <Chart
          width={contentDimensions.width}
          height={contentDimensions.height}
        />
      )}
    </GraphQueryRunner>
  );
}
