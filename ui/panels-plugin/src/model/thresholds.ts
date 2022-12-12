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

import { UnitOptions } from '@perses-dev/components';
import { zip } from 'lodash-es';

// TODO (sjcobb): pull threshold colors from perses charts theme
export const ThresholdColors = {
  GREEN: 'rgba(47, 191, 114, 1)', // green.500
  YELLOW: 'rgba(255, 193, 7, 1)',
  ORANGE: 'rgba(255, 159, 28, 0.9)', // orange.500
  RED: 'rgba(234, 71, 71, 1)', // red.500
};

export const ThresholdColorsPalette = [ThresholdColors.ORANGE, ThresholdColors.RED];

export type ThresholdColorsType = keyof typeof ThresholdColors | string;

export type GaugeColorStop = [number, string];

export type EChartsAxisLineColors = GaugeColorStop[];

export interface StepOptions {
  value: number;
  color?: ThresholdColorsType;
  name?: string;
}

export interface ThresholdOptions {
  default_color?: string;
  max?: number;
  steps?: StepOptions[];
}

export const defaultThresholdInput: ThresholdOptions = { steps: [{ value: 0, color: ThresholdColors.GREEN }] };

export function convertThresholds(thresholds: ThresholdOptions, unit: UnitOptions, max: number): EChartsAxisLineColors {
  const defaultThresholdColor = thresholds.default_color ?? ThresholdColors.GREEN;
  const defaultThresholdSteps: EChartsAxisLineColors = [[0, defaultThresholdColor]];

  if (thresholds.steps !== undefined) {
    // https://echarts.apache.org/en/option.html#series-gauge.axisLine.lineStyle.color
    // color segments must be decimal between 0 and 1
    const segmentMax = 1;

    const valuesArr: number[] = thresholds.steps.map((step: StepOptions) => {
      if (unit.kind === 'PercentDecimal') return step.value;
      return step.value / max; // max needed for Decimal and Percent conversion
    });
    valuesArr.push(segmentMax);

    const colorsArr = thresholds.steps.map((step: StepOptions, index) => step.color ?? ThresholdColorsPalette[index]);
    colorsArr.unshift(defaultThresholdColor);

    const zippedArr = zip(valuesArr, colorsArr);
    return zippedArr.map((elem) => {
      const convertedValues = elem[0] ?? segmentMax;
      const convertedColors = elem[1] ?? defaultThresholdColor;
      return [convertedValues, convertedColors];
    });
  } else {
    return defaultThresholdSteps;
  }
}
