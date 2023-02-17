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

export interface StepOptions {
  value: number;
  color?: string;
  name?: string;
}

export interface ThresholdOptions {
  mode?: 'percentage' | 'absolute';
  default_color?: string;
  max?: number; // is this same as the max in GaugeChartOptions? can we remove?
  steps?: StepOptions[];
}
