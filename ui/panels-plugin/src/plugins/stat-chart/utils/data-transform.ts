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
import { LineSeriesOption } from 'echarts/charts';
import { applyValueMapping } from '@perses-dev/core';
import { StatChartOptions, StatChartSparklineOptions } from '../stat-chart-model';

export function getStatChartColor(
  chartsTheme: PersesChartsTheme,
  spec?: StatChartOptions,
  value?: number | string | null
) {
  const { mappings, thresholds } = spec ?? {};

  // thresholds color takes priority over other colors
  const defaultColor = thresholds?.defaultColor ?? chartsTheme.thresholds.defaultColor;

  if (!value || (!thresholds?.steps && !mappings)) {
    return defaultColor;
  }

  // Check thresholds first (they take priority)
  if (thresholds?.steps && typeof value === 'number') {
    const matchingColors = thresholds.steps
      .map((step, index) => {
        if (value > step.value) {
          return step.color ?? chartsTheme.thresholds.palette[index] ?? defaultColor;
        }
        return null;
      })
      .filter((color): color is string => color !== null);

    // Return last matching color or default
    return matchingColors[matchingColors.length - 1] ?? defaultColor;
  }

  if (mappings?.length) {
    const { color } = applyValueMapping(value, mappings);
    return color || defaultColor;
  }

  return defaultColor;
}

export function convertSparkline(
  chartsTheme: PersesChartsTheme,
  color: string,
  sparkline?: StatChartSparklineOptions
): LineSeriesOption | undefined {
  if (sparkline === undefined) return;

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
