import { TimeSeriesData } from '@perses-dev/core';
import { QueryData } from '@perses-dev/plugin-system';
import { createStatusHistoryDataModel } from './data-transform';

describe('createStatusHistoryDataModel', () => {
  it('should return empty model for empty query results', () => {
    const result = createStatusHistoryDataModel([], []);
    expect(result).toEqual({
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
          series: [
            {
              name: 'instance1',
              formattedName: 'instance1',
              values: [
                [1609459200000, 1],
                [1609459260000, 2],
              ],
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
    const result = createStatusHistoryDataModel(queryResults, colors);

    expect(result.legendItems).toEqual([
      { id: '0-1', label: '1', color: '#ff0000' },
      { id: '1-2', label: '2', color: '#00ff00' },
    ]);
    expect(result.statusHistoryData).toEqual([
      [0, 0, 1],
      [1, 0, 2],
    ]);
    expect(result.xAxisCategories).toEqual([1609459200000, 1609459260000]);
    expect(result.yAxisCategories).toEqual(['instance1']);
  });
});
