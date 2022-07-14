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
import { GraphQueryDefinition, useGraphQuery, PanelProps } from '@perses-dev/plugin-system';
import { GaugeChart, GaugeChartData, UnitOptions } from '@perses-dev/components';
import { Skeleton } from '@mui/material';
import { useMemo } from 'react';
import { convertThresholds, defaultThresholdInput, ThresholdOptions } from '../../model/thresholds';
import { CalculationsMap, CalculationType } from '../../model/calculations';
import { useSuggestedStepMs } from '../../model/time';

export const GaugeChartKind = 'GaugeChart' as const;

export type GaugeChartPanelProps = PanelProps<GaugeChartOptions>;

interface GaugeChartOptions extends JsonObject {
  query: GraphQueryDefinition;
  calculation: CalculationType;
  unit?: UnitOptions;
  thresholds?: ThresholdOptions;
}

export function GaugeChartPanel(props: GaugeChartPanelProps) {
  const {
    definition: {
      options: { query, calculation },
    },
    contentDimensions,
  } = props;
  const unit = props.definition.options.unit ?? { kind: 'PercentDecimal', decimal_places: 1 };
  const suggestedStepMs = useSuggestedStepMs(contentDimensions?.width);
  const { data, loading, error } = useGraphQuery(query, { suggestedStepMs });

  const chartData: GaugeChartData = useMemo(() => {
    if (data === undefined) return undefined;

    const series = Array.from(data.series)[0];
    if (series === undefined) return undefined;

    const calculate = CalculationsMap[calculation];
    const value = calculate(Array.from(series.values));
    if (value === undefined) return null;

    return value;
  }, [data, calculation]);

  if (error) throw error;

  if (contentDimensions === undefined) return null;

  if (loading === true) {
    return (
      <Skeleton
        sx={{ margin: '0 auto' }}
        variant="circular"
        width={contentDimensions.width > contentDimensions.height ? contentDimensions.height : contentDimensions.width}
        height={contentDimensions.height}
      />
    );
  }

  const thresholds = props.definition.options.thresholds ?? defaultThresholdInput;
  if (thresholds.max === undefined) {
    if (unit.kind === 'Percent') {
      thresholds.max = 100;
    } else if (unit.kind === 'PercentDecimal') {
      thresholds.max = 1;
    }
  }
  const axisLineColors = convertThresholds(thresholds, unit);
  const axisLine = {
    show: true,
    lineStyle: {
      width: 5,
      color: axisLineColors,
    },
  };

  return (
    <GaugeChart
      width={contentDimensions.width}
      height={contentDimensions.height}
      data={chartData}
      unit={unit}
      axisLine={axisLine}
      max={thresholds.max}
    />
  );
}
