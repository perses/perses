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

import { TimeSeriesData } from '@perses-dev/core';
import { QueryData } from '@perses-dev/plugin-system';
import { renderHook } from '@testing-library/react';
import { useStatusHistoryDataModel } from './data-transform';

describe('useStatusHistoryDataModel', () => {
  it('should return empty model for empty query results', () => {
    const { result } = renderHook(() => useStatusHistoryDataModel([], []));
    expect(result.current).toEqual({
      legendItems: [],
      statusHistoryData: [],
      xAxisCategories: [],
      yAxisCategories: [],
    });
  });

  it('should process query results correctly', () => {
    const queryResults: Array<QueryData<TimeSeriesData>> = [
      {
        data: {
          timeRange: {
            start: new Date(1609459200000),
            end: new Date(1609459260000),
          },
          stepMs: 60000,
          series: [
            {
              name: 'instance1',
              formattedName: 'instance1',
              values: [
                [1609459200000, 1],
                [1609459260000, 2],
              ],

              // stepMs?: number;
            },
          ],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        definition: { query: 'some-query' } as any,
        error: undefined,
        isFetching: false,
        isLoading: false,
      },
    ];
    const colors = ['#ff0000', '#00ff00'];
    const { result } = renderHook(() => useStatusHistoryDataModel(queryResults, colors));

    expect(result.current.legendItems).toEqual([
      { id: '0-1', label: '1', color: '#ff0000' },
      { id: '1-2', label: '2', color: '#00ff00' },
    ]);
    expect(result.current.statusHistoryData).toEqual([
      [0, 0, 1],
      [1, 0, 2],
    ]);
    expect(result.current.xAxisCategories).toEqual([1609459200000, 1609459260000]);
    expect(result.current.yAxisCategories).toEqual(['instance1']);
  });
});
