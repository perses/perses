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

import { PieChartData, SortOption } from '@perses-dev/components';
import { DEFAULT_SORT } from './pie-chart-model';

export function calculatePercentages(data: PieChartData[]): Array<{ name: string; value: number }> {
  const sum = data.reduce((accumulator, { value }) => accumulator + (value ?? 0), 0);
  return data.map((seriesData) => {
    const percentage = ((seriesData.value ?? 0) / sum) * 100;
    return {
      ...seriesData,
      value: percentage,
    };
  });
}

export function sortSeriesData(data: PieChartData[], sortOrder: SortOption = DEFAULT_SORT): PieChartData[] {
  if (sortOrder === 'asc') {
    // sort in ascending order by value
    return data.sort((a, b) => {
      if (a.value === null) {
        return 1;
      }
      if (b.value === null) {
        return -1;
      }
      if (a.value === b.value) {
        return 0;
      }
      return a.value < b.value ? 1 : -1;
    });
  } else {
    // sort in descending order by value
    return data.sort((a, b) => {
      if (a.value === null) {
        return -1;
      }
      if (b.value === null) {
        return 1;
      }
      if (a.value === b.value) {
        return 0;
      }
      return a.value < b.value ? -1 : 1;
    });
  }
}
