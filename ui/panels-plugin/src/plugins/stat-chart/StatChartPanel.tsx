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
import { StatChart, StatChartData, UnitOptions, useChartsTheme, PersesChartsTheme } from '@perses-dev/components';
import { Box, Skeleton } from '@mui/material';
import { LineSeriesOption } from 'echarts/charts';
import { useMemo } from 'react';
import { GraphQueryDefinition, GraphData, useGraphQuery, PanelProps } from '@perses-dev/plugin-system';
import { ThresholdOptions } from '../../model/thresholds';
import { CalculationsMap, CalculationType } from '../../model/calculations';
import { useSuggestedStepMs } from '../../model/time';

export const StatChartKind = 'StatChart' as const;

export type StatChartPanelProps = PanelProps<StatChartOptions>;

export interface SparklineOptions extends JsonObject {
  color?: string;
  width?: number;
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
    contentDimensions,
  } = props;
  const suggestedStepMs = useSuggestedStepMs(contentDimensions?.width);
  const { data, loading, error } = useGraphQuery(query, { suggestedStepMs });
  const chartData = useChartData(data, calculation, name);
  const chartsTheme = useChartsTheme();

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
      sparkline={convertSparkline(chartsTheme, sparkline)}
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

    const seriesData = Array.from(data.series)[0];
    const calculate = CalculationsMap[calculation];
    const calculatedValue = seriesData !== undefined ? calculate(Array.from(seriesData.values)) : undefined;

    return {
      calculatedValue,
      seriesData,
      name,
    };
  }, [data, calculation, name]);
};

export function convertSparkline(
  chartsTheme: PersesChartsTheme,
  sparkline?: SparklineOptions
): LineSeriesOption | undefined {
  if (sparkline === undefined) return;

  return {
    lineStyle: {
      width: sparkline.width ?? chartsTheme.sparkline.width,
      color: sparkline.color ?? chartsTheme.sparkline.color,
      opacity: 1,
    },
    areaStyle: {
      color: sparkline.color ?? chartsTheme.sparkline.color,
      opacity: 0.4,
    },
  };
}
