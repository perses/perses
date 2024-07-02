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

import { Span, TraceData } from '@perses-dev/core';

/**
 * Mock data we get from getTraceData() in @perses/tempo-plugin.
 */
export const MOCK_TRACE_DATA: TraceData = {
  searchResult: [
    {
      startTimeUnixMs: 1702915645000, // unix epoch time in milliseconds
      durationMs: 100,
      serviceStats: {
        'service-name': {
          spanCount: 10,
        },
        'second-service-name': {
          spanCount: 3,
          errorCount: 2,
        },
      },
      traceId: '123',
      rootServiceName: 'service-name',
      rootTraceName: 'span-name',
    },
  ],
  metadata: {
    executedQueryString: '{duration > 500ms}',
  },
};

export const MOCK_EMPTY_TRACE_DATA: TraceData = {
  searchResult: [],
  metadata: {
    executedQueryString: '{duration > 500ms}',
  },
};

/**
 * Mocks results obtained from useTraceQueries() in @perses/plugin-system/runtime.
 * This function uses then React TanStack function useQueries(fooQuery) to
 * handle fetching.
 */
export const MOCK_TRACE_QUERY_RESULT = [
  {
    status: 'success',
    fetchStatus: 'idle',
    isLoading: false,
    isSuccess: true,
    isError: false,
    data: MOCK_TRACE_DATA,
    dataUpdatedAt: 1666500979895,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isStale: true,
  },
];

export const MOCK_EMPTY_TRACE_QUERY_RESULT = [
  {
    status: 'success',
    fetchStatus: 'idle',
    isLoading: false,
    isSuccess: true,
    isError: false,
    data: MOCK_EMPTY_TRACE_DATA,
    dataUpdatedAt: 1666500979895,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isStale: true,
  },
];

export const shopBackendResource = {
  serviceName: 'shop-backend',
  attributes: [
    {
      key: 'service.name',
      value: {
        stringValue: 'shop-backend',
      },
    },
  ],
};

export const k6scope = {
  name: 'k6',
};

export const trace1_root: Span = {
  resource: shopBackendResource,
  scope: k6scope,
  childSpans: [],

  traceId: 'tid1',
  spanId: 'sid1',
  name: 'testRootSpan',
  kind: 'SPAN_KIND_SERVER',
  startTimeUnixMs: 1000,
  endTimeUnixMs: 2000,
  attributes: [],
  events: [],
};

export const trace1_root_child1: Span = {
  resource: shopBackendResource,
  scope: k6scope,
  parentSpan: trace1_root,
  childSpans: [],

  traceId: 'tid1',
  spanId: 'sid2',
  parentSpanId: 'sid1',
  name: 'testChildSpan2',
  kind: 'SPAN_KIND_CLIENT',
  startTimeUnixMs: 1100,
  endTimeUnixMs: 1200,
  attributes: [
    {
      key: 'http.method',
      value: {
        stringValue: 'DELETE',
      },
    },
  ],
  events: [
    {
      timeUnixMs: 1150,
      name: 'event1_name',
      attributes: [
        {
          key: 'event1_key',
          value: {
            stringValue: 'event1_value',
          },
        },
      ],
    },
  ],
  status: {
    message: 'Forbidden',
    code: 'STATUS_CODE_ERROR',
  },
};
trace1_root.childSpans = [trace1_root_child1];

export const trace1_root_child1_child1: Span = {
  resource: shopBackendResource,
  scope: k6scope,
  parentSpan: trace1_root_child1,
  childSpans: [],

  traceId: 'tid1',
  spanId: 'sid3',
  parentSpanId: 'sid2',
  name: 'testChildSpan3',
  kind: 'SPAN_KIND_CLIENT',
  startTimeUnixMs: 1300,
  endTimeUnixMs: 1450,
  attributes: [
    {
      key: 'http.method',
      value: {
        stringValue: 'PUT',
      },
    },
  ],
  events: [],
};
trace1_root_child1.childSpans = [trace1_root_child1_child1];
