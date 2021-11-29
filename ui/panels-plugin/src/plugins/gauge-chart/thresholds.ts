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

import { merge } from 'lodash-es';

export const ThresholdColors = {
  GREEN: 'rgba(115, 191, 105, 1)',
  ORANGE: 'rgba(237, 129, 40, 1)',
  RED: 'rgba(245, 54, 54, 1)',
  BLUE: '#0000FF',
};

export type ThresholdColorsType = keyof typeof ThresholdColors | string;

export type ThresholdOptions = {
  steps: StepOptions[];
  default_color?: string;
};

export type StepOptions = {
  value: number;
  color: ThresholdColorsType;
};

// TODO (scobb): should this be useConvertThresholds(thresholds: ThresholdOptions)
// see: useFilterAlertRules
export function convertThresholds(thresholds: ThresholdOptions) {
  const defaultThresholdColor =
    thresholds.default_color || ThresholdColors.GREEN;
  const defaultThresholdArr: [number, string] = [0, defaultThresholdColor];
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
    const thresholdTemplate =
      defaultThresholds.steps[index] || defaultThresholds.steps[0];
    const stepObj: StepOptions = merge(thresholdTemplate, step);
    stepObj.value = stepObj.value / 100;
    return Object.values(stepObj) as [number, string];
  });

  const lastItem = stepsArr[stepsArr.length - 1] || [1, defaultAlertColor];
  const lastColor = lastItem[1] || defaultAlertColor;
  const shiftedArr: Array<[number, string]> = [...stepsArr, [1, lastColor]];

  // TODO (sjcobb): fix colors for 4th, 5th, etc. steps passed
  return shiftedArr.map((item, index, arr) => {
    if (index === arr.length - 1) return item;
    const currentItemValue = item[0];
    if (index >= 1) {
      const prevItem = arr[index - 1] || defaultThresholdArr;
      const prevItemColor = prevItem[1];
      const newItem: [number, string] = [currentItemValue, prevItemColor];
      return newItem;
    } else {
      const firstItem: [number, string] = [
        currentItemValue,
        defaultThresholdColor,
      ];
      return firstItem;
    }
  });
}
