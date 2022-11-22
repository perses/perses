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

import type { GaugeSeriesOption } from 'echarts';
import { useTimeSeriesQuery, PanelProps, CalculationsMap } from '@perses-dev/plugin-system';
import { GaugeChart, GaugeSeries } from '@perses-dev/components';
import { Skeleton, Stack } from '@mui/material';
import { useMemo } from 'react';
import { convertThresholds, defaultThresholdInput } from '../../model/thresholds';
import { useSuggestedStepMs } from '../../model/time';
import { GaugeChartOptions, DEFAULT_UNIT } from './gauge-chart-model';

export type GaugeChartPanelProps = PanelProps<GaugeChartOptions>;

export function GaugeChartPanel(props: GaugeChartPanelProps) {
  const { spec: pluginSpec, contentDimensions } = props;
  const { query, calculation, max } = pluginSpec;

  const unit = pluginSpec.unit ?? DEFAULT_UNIT;
  const thresholds = pluginSpec.thresholds ?? defaultThresholdInput;

  const suggestedStepMs = useSuggestedStepMs(contentDimensions?.width);
  const { data, isLoading, error } = useTimeSeriesQuery(query, { suggestedStepMs });

  const gaugeData: GaugeSeries[] = useMemo(() => {
    if (data === undefined) {
      return [];
    }
    const seriesData: GaugeSeries[] = [];
    for (const timeSeries of data.series) {
      const calculate = CalculationsMap[calculation];
      const series = {
        value: calculate(Array.from(timeSeries.values)),
        label: timeSeries.formattedName ?? '',
      };
      seriesData.push(series);
    }
    return seriesData;
  }, [data, calculation]);

  if (error) throw error;

  if (contentDimensions === undefined) return null;

  // TODO: fix loading state
  if (isLoading === true) {
    return (
      <Skeleton
        sx={{ margin: '0 auto' }}
        variant="circular"
        width={contentDimensions.width > contentDimensions.height ? contentDimensions.height : contentDimensions.width}
        height={contentDimensions.height}
      />
    );
  }

  // needed for end value of last threshold color segment
  let thresholdMax = max;
  if (thresholdMax === undefined) {
    if (unit.kind === 'PercentDecimal') {
      thresholdMax = 1;
    } else {
      thresholdMax = 100;
    }
  }
  const axisLineColors = convertThresholds(thresholds, unit, thresholdMax);
  const axisLine: GaugeSeriesOption['axisLine'] = {
    show: true,
    lineStyle: {
      width: 5,
      color: axisLineColors,
    },
  };

  const chartWidth = contentDimensions.width / gaugeData.length;

  return (
    <Stack direction="row">
      {gaugeData.map((series, seriesIndex) => (
        <GaugeChart
          key={`gauge-series-${seriesIndex}`}
          width={chartWidth}
          height={contentDimensions.height}
          data={series}
          unit={unit}
          axisLine={axisLine}
          max={thresholdMax}
        />
      ))}
    </Stack>
  );
}
