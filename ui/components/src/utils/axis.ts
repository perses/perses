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

import merge from 'lodash/merge';
import type { XAXisComponentOption, YAXisComponentOption } from 'echarts';
import { formatValue, UnitOptions } from '@perses-dev/core';

/*
 * Populate yAxis or xAxis properties, returns an Array since multiple axes will be supported in the future
 */
export function getFormattedAxis(axis?: YAXisComponentOption | XAXisComponentOption, unit?: UnitOptions) {
  // TODO: support alternate yAxis that shows on right side
  const AXIS_DEFAULT = {
    type: 'value',
    boundaryGap: [0, '10%'],
    axisLabel: {
      formatter: (value: number) => {
        return formatValue(value, unit);
      },
    },
  };
  return [merge(AXIS_DEFAULT, axis)];
}

/**
 * Calculate date range, used as a fallback when xAxis time range not passed as prop
 */
export function getDateRange(data: number[]) {
  const defaultRange = 3600000; // hour in ms
  if (data.length === 0) return defaultRange;
  const lastDatum = data[data.length - 1];
  if (data[0] === undefined || lastDatum === undefined) return defaultRange;
  return lastDatum - data[0];
}
