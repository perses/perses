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

import { JsonObject } from '@perses-dev/core';
import { Box, Skeleton } from '@mui/material';
import { LineSeriesOption } from 'echarts/charts';
import { useMemo } from 'react';
import { GraphQueryDefinition, GraphData, useGraphQuery, PanelProps } from '@perses-dev/plugin-system';
import { usePanelContext } from '@perses-dev/dashboards';
import { CalculationsMap, CalculationType } from '../../model/calculations';
import { UnitOptions } from '../../model/units';
import { ThresholdOptions, defaultThresholdInput } from '../../model/thresholds';
import { StatChartData, StatChart } from '../../components/stat-chart/StatChart';

export const StatChartKind = 'StatChart' as const;

export type StatChartPanelProps = PanelProps<StatChartOptions>;

export interface SparklineOptions extends JsonObject {
  line_color?: string;
  line_width?: number;
  line_opacity?: number;
  area_color?: string;
  area_opacity?: number;
}

interface StatChartOptions extends JsonObject {
  name: string;
  query: GraphQueryDefinition;
  calculation: CalculationType;
  unit: UnitOptions;
  thresholds?: ThresholdOptions;
  sparkline?: SparklineOptions;
}

export function StatChartPanel(props: StatChartPanelProps) {
  const {
    definition: {
      display: { name },
      options: { query, calculation, unit, sparkline },
    },
  } = props;
  const thresholds = props.definition.options.thresholds ?? defaultThresholdInput;
  const { contentDimensions } = usePanelContext();
  const { data, loading, error } = useGraphQuery(query);
  const chartData = useChartData(data, calculation, name);

  if (error) throw error;

  if (contentDimensions === undefined) return null;

  if (loading === true) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        width={contentDimensions.width}
        height={contentDimensions.height}
      >
        <Skeleton variant="text" width={contentDimensions.width - 20} height={contentDimensions.height / 2} />
      </Box>
    );
  }

  return (
    <StatChart
      width={contentDimensions.width}
      height={contentDimensions.height}
      data={chartData}
      unit={unit}
      thresholds={thresholds}
      sparkline={convertSparkline(sparkline)}
    />
  );
}

const useChartData = (data: GraphData | undefined, calculation: CalculationType, name: string): StatChartData => {
  return useMemo(() => {
    const loadingData = {
      calculatedValue: undefined,
      seriesData: undefined,
    };
    if (data === undefined) return loadingData;

    const seriesData = Array.from(data.series)[0] ?? null;
    const calculate = CalculationsMap[calculation];
    const calculatedValue = seriesData !== null ? calculate(Array.from(seriesData.values)) : null;

    return {
      calculatedValue,
      seriesData,
      name,
    };
  }, [data, calculation, name]);
};

export function convertSparkline(sparkline?: SparklineOptions): LineSeriesOption | undefined {
  if (sparkline === undefined) return;

  // TODO (sjcobb): define long-term approach for perses format conversion, add unit test
  return {
    lineStyle: {
      width: sparkline.line_width ?? 2,
      color: sparkline.line_color ?? '#FFFFFF',
      opacity: sparkline.line_opacity ?? 0.35,
    },
    areaStyle: {
      color: sparkline.area_color ?? '#FFFFFF',
      opacity: sparkline.area_opacity ?? 0.25,
    },
  };
}
