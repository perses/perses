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
import { SparklineOptions } from '../stat-chart-model';

export function getColorFromThresholds(
  chartsTheme: PersesChartsTheme,
  thresholds?: ThresholdOptions,
  value?: number,
  defaultColor?: string
) {
  let color: string | undefined = defaultColor ?? chartsTheme.thresholds.defaultColor;

  if (thresholds === undefined) {
    return color;
  }

  if (thresholds.steps && value) {
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
  sparkline?: SparklineOptions,
  thresholds?: ThresholdOptions,
  value?: number
): LineSeriesOption | undefined {
  if (sparkline === undefined) return;

  // TO DO: add option for color scheme? Should default color derive from threshold.defaultColor or sparkline.color?
  const defaultColor = chartsTheme.thresholds.defaultColor ?? chartsTheme.sparkline.color;
  const color = getColorFromThresholds(chartsTheme, thresholds, value, sparkline.color ?? defaultColor);

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
