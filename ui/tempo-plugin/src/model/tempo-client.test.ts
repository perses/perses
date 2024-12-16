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

import {
  MOCK_SEARCH_RESPONSE_MIXED_VPARQUET3_AND_4,
  MOCK_SEARCH_RESPONSE_VPARQUET3,
  MOCK_SEARCH_RESPONSE_VPARQUET4,
  MOCK_TRACE_RESPONSE,
} from '../test';
import { searchWithFallback } from './tempo-client';

const fetchMock = (global.fetch = jest.fn());

describe('tempo-client', () => {
  it('should return query results as-is when serviceStats are present', async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(MOCK_SEARCH_RESPONSE_VPARQUET4) });

    const results = await searchWithFallback({ q: '{}' }, { datasourceUrl: '' });
    expect(results).toEqual(MOCK_SEARCH_RESPONSE_VPARQUET4);
  });

  it('should augment query results with serviceStats if they are not present', async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(MOCK_SEARCH_RESPONSE_VPARQUET3) });
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(MOCK_TRACE_RESPONSE) });

    const results = await searchWithFallback({ q: '{}' }, { datasourceUrl: '' });
    expect(results).toEqual(MOCK_SEARCH_RESPONSE_VPARQUET4);
  });

  it('should augment query results with serviceStats if they are partially present', async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(MOCK_SEARCH_RESPONSE_MIXED_VPARQUET3_AND_4) });
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(MOCK_TRACE_RESPONSE) });

    const results = await searchWithFallback({ q: '{}' }, { datasourceUrl: '' });

    // in the mock response, the first trace contains serviceStats but the second trace does not contain serviceStats
    expect(results.traces[0]?.serviceStats).toEqual({
      telemetrygen: { spanCount: 2 },
    });
    expect(results.traces[1]?.serviceStats).toEqual({
      'article-service': { spanCount: 2 },
      'auth-service': { spanCount: 1 },
      'cart-service': { spanCount: 2 },
      postgres: { spanCount: 1 },
      'shop-backend': { spanCount: 4 },
    });
  });
});
