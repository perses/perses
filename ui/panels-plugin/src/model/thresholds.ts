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
import { zip } from 'lodash-es';

// TODO (sjcobb): pull threshold colors from perses charts theme
export const ThresholdColors = {
  GREEN: 'rgba(115, 191, 105, 1)',
  YELLOW: 'rgba(255, 193, 7, 1)',
  ORANGE: 'rgba(253, 126, 20, 0.9)',
  RED: 'rgba(220, 53, 69, 1)',
};

export const ThresholdColorsPalette = [ThresholdColors.ORANGE, ThresholdColors.RED];

export type ThresholdColorsType = keyof typeof ThresholdColors | string;

export type GaugeColorStop = [number, string];

export type EChartsAxisLineColors = GaugeColorStop[];

export interface StepOptions extends JsonObject {
  value: number;
  color?: ThresholdColorsType;
  name?: string;
}

export interface ThresholdOptions extends JsonObject {
  default_color?: string;
  steps?: StepOptions[];
}

export const defaultThresholdInput: ThresholdOptions = { steps: [{ value: 0, color: ThresholdColors.GREEN }] };

export function convertThresholds(thresholds: ThresholdOptions): EChartsAxisLineColors {
  const defaultThresholdColor = thresholds.default_color ?? ThresholdColors.GREEN;
  const defaultThresholdSteps: EChartsAxisLineColors = [[0, defaultThresholdColor]];

  if (thresholds.steps) {
    const valuesArr: number[] = thresholds.steps.map((step: StepOptions) => step.value / 100);
    valuesArr.push(1);

    const colorsArr = thresholds.steps.map((step: StepOptions, index) => step.color ?? ThresholdColorsPalette[index]);
    colorsArr.unshift(defaultThresholdColor);

    const zippedArr = zip(valuesArr, colorsArr);
    return zippedArr.map((elem) => {
      const convertedValues = elem[0] ?? 1;
      const convertedColors = elem[1] ?? defaultThresholdColor;
      return [convertedValues, convertedColors];
    });
  } else {
    return defaultThresholdSteps;
  }
}
