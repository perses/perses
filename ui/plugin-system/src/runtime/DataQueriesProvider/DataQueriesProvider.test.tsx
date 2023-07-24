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

import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { MOCK_TIME_SERIES_DATA } from '../../test';
import { DataQueriesProvider, useDataQueries } from './DataQueriesProvider';

jest.mock('../time-series-queries', () => ({
  useTimeSeriesQueries: jest.fn().mockImplementation(() => [{ data: MOCK_TIME_SERIES_DATA }]),
}));

describe('useDataQueries', () => {
  it('should return the correct data for TimeSeriesQuery', () => {
    const definitions = [
      {
        type: 'TimeSeriesQuery',
        kind: 'PrometheusTimeSeriesQuery',
        spec: {
          query: 'up',
        },
      },
    ];

    const wrapper = ({ children }: React.PropsWithChildren) => {
      return <DataQueriesProvider definitions={definitions}>{children}</DataQueriesProvider>;
    };

    const { result } = renderHook(() => useDataQueries('TimeSeriesQuery'), {
      wrapper,
    });
    expect(result.current.queryResults[0]?.data).toEqual(MOCK_TIME_SERIES_DATA);
  });
});

describe('DataQueriesProvider', () => {
  it('should throw an errory for unsupported query type', () => {
    const definitions = [
      {
        type: 'CustomQuery',
        kind: 'CustomQueryPlugin',
        spec: {
          query: 'hi',
        },
      },
    ];
    expect(() => {
      render(<DataQueriesProvider definitions={definitions} />);
    }).toThrow('Query type is not supported: CustomQuery');
  });
});
