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

import { PersesChartsTheme } from '@perses-dev/components';
import { ThresholdOptions } from '@perses-dev/core';
import { LineSeriesOption } from 'echarts/charts';
import { StatChartSparklineOptions } from '../stat-chart-model';

export function getColorFromThresholds(
  chartsTheme: PersesChartsTheme,
  thresholds?: ThresholdOptions,
  value?: number | null
): string {
  // thresholds color takes priority over other colors
  const defaultColor = thresholds?.defaultColor ?? chartsTheme.thresholds.defaultColor;

  if (thresholds === undefined) {
    return defaultColor;
  }

  let color = defaultColor;
  if (thresholds.steps && value && typeof value === 'number') {
    thresholds.steps.forEach((step, index) => {
      if (value > step.value) {
        color = step.color ?? chartsTheme.thresholds.palette[index] ?? defaultColor;
      } else {
        // thresholds.steps should be in ascending order, so return if value is less than step.value
        return;
      }
    });
  }
  return color;
}

export function convertSparkline(
  chartsTheme: PersesChartsTheme,
  sparkline?: StatChartSparklineOptions,
  thresholds?: ThresholdOptions,
  value?: number | null
): LineSeriesOption | undefined {
  if (sparkline === undefined) return;

  // sparkline color should always derive from thresholds
  // ignore sparkline.color since you can always change the thresholds default color
  const color = getColorFromThresholds(chartsTheme, thresholds, value);

  return {
    lineStyle: {
      width: sparkline.width ?? chartsTheme.sparkline.width,
      color,
      opacity: 1,
    },
    areaStyle: {
      color,
      opacity: 0.4,
    },
  };
}
