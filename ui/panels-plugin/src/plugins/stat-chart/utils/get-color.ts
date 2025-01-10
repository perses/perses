// Copyright 2024 The Perses Authors
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
import { applyValueMapping, ThresholdOptions, ValueMapping } from '@perses-dev/core';
import { StatChartOptions } from '../stat-chart-model';

type StatChartValue = number | string | null;

export function getStatChartColor(
  chartsTheme: PersesChartsTheme,
  spec?: StatChartOptions,
  value?: StatChartValue
): string {
  const { mappings, thresholds } = spec ?? {};

  // Determine the default color from thresholds or theme
  const defaultColor = thresholds?.defaultColor ?? chartsTheme.thresholds.defaultColor;

  if (!value || (!thresholds?.steps && !mappings)) {
    return defaultColor;
  }

  // Check mappings first
  if (mappings?.length) {
    const colorFromMappings = getColorFromMappings(value, mappings);
    if (colorFromMappings) {
      return colorFromMappings;
    }
  }

  // Check thresholds next
  if (thresholds) {
    const colorFromThresholds = getColorFromThresholds(value, thresholds, chartsTheme, defaultColor);
    if (colorFromThresholds) {
      return colorFromThresholds;
    }
  }

  // Fallback to default color
  return defaultColor;
}

function getColorFromMappings(value: StatChartValue, mappings: ValueMapping[]): string | null {
  if (mappings?.length && value) {
    const { color } = applyValueMapping(value, mappings);
    return color || null;
  }
  return null;
}

function getColorFromThresholds(
  value: StatChartValue,
  thresholds: ThresholdOptions,
  chartsTheme: PersesChartsTheme,
  defaultColor: string
): string | null {
  if (thresholds?.steps && typeof value === 'number') {
    const matchingColors = thresholds.steps
      .map((step, index) => {
        if (value >= step.value) {
          return step.color ?? chartsTheme.thresholds.palette[index] ?? defaultColor;
        }
        return null;
      })
      .filter((color): color is string => color !== null);

    return matchingColors[matchingColors.length - 1] ?? null;
  }
  return null;
}
