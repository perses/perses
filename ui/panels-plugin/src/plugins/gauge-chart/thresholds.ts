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

export const ThresholdColorsMap = {
  green: 'rgb(115, 191, 105)',
  orange: 'rgba(237, 129, 40, 0.89)',
  red: 'rgba(245, 54, 54, 0.9)',
};

export type ThresholdColorsType = keyof typeof ThresholdColorsMap;

export type ThresholdOptions = {
  steps: StepOptions[];
};

type StepOptions = {
  // color: string;
  color: ThresholdColorsType;
  value: number;
};
