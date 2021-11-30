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

import { JsonObject } from '@perses-ui/core';
import { merge } from 'lodash-es';

export const ThresholdColors = {
  GREEN: 'rgba(115, 191, 105, 1)',
  ORANGE: 'rgba(237, 129, 40, 0.9)',
  RED: 'rgba(245, 54, 54, 0.9)',
};

export type ThresholdColorsType = keyof typeof ThresholdColors | string;

export type GaugeColorStop = [number, string];

export interface StepOptions extends JsonObject {
  value: number;
  color: ThresholdColorsType;
}

export interface ThresholdOptions extends JsonObject {
  steps: StepOptions[];
  default_color?: string;
}

export function convertThresholds(
  thresholds: ThresholdOptions = {
    steps: [{ value: 0, color: ThresholdColors.GREEN }],
  }
) {
  const defaultThresholdColor = thresholds.default_color || ThresholdColors.GREEN;
  const defaultThresholdArr: GaugeColorStop = [0, defaultThresholdColor];
  const defaultWarningColor = ThresholdColors.ORANGE;
  const defaultAlertColor = ThresholdColors.RED;

  const defaultThresholds: ThresholdOptions = {
    default_color: defaultThresholdColor,
    steps: [
      {
        value: 85,
        color: defaultWarningColor,
      },
      {
        value: 95,
        color: defaultAlertColor,
      },
    ],
  };

  // converts to 2d array structure needed for series-gauge.axisLine.lineStyle.color
  const stepsArr = thresholds.steps.map((step: StepOptions, index) => {
    const defaultThresholdStep = defaultThresholds.steps[index] || defaultThresholds.steps[0];
    const mergedStep: StepOptions = merge(defaultThresholdStep, step);
    mergedStep.value = mergedStep.value / 100; // TODO (sjcobb): support gauge formats other than percents
    return Object.values(mergedStep) as GaugeColorStop;
  });

  const lastItem = stepsArr[stepsArr.length - 1] || [1, defaultAlertColor];
  const lastColor = lastItem[1] || defaultAlertColor;
  const shiftedArr: GaugeColorStop[] = [...stepsArr, [1, lastColor]];

  // shifts values since ECharts expects color with max instead of min
  return shiftedArr.map((item, index, arr) => {
    if (index === arr.length - 1) return item;
    if (index >= 1) {
      const prevItem = arr[index - 1] || defaultThresholdArr;
      const prevItemColor = prevItem[1];
      const offsetItem: GaugeColorStop = [item[0], prevItemColor];
      return offsetItem;
    } else {
      const firstItem: GaugeColorStop = [item[0], defaultThresholdColor];
      return firstItem;
    }
  });
}
