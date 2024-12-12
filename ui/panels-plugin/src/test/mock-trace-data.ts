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

import { Span, Trace, TraceData } from '@perses-dev/core';
import { GanttTrace } from '../plugins/tracing-gantt-chart/TracingGanttChart/trace';
import { JaegerTrace, parseJaegerTrace } from './get-trace-data-jaeger';

function addParentReferences(span: Span): void {
  for (const child of span.childSpans) {
    child.parentSpan = span;
    addParentReferences(child);
  }
}

/**
 * Mock data we get from getTraceData() in @perses/tempo-plugin.
 */
export const MOCK_TRACE_SEARCH_RESULT: TraceData = {
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

export const MOCK_TRACE_SEARCH_RESULT_EMPTY: TraceData = {
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
export const MOCK_TRACE_SEARCH_RESULT_QUERY_RESULT = [
  {
    status: 'success',
    fetchStatus: 'idle',
    isLoading: false,
    isSuccess: true,
    isError: false,
    data: MOCK_TRACE_SEARCH_RESULT,
    dataUpdatedAt: 1666500979895,
    definition: {
      kind: 'TraceQuery',
      spec: {
        plugin: {
          kind: 'TempoTraceQuery',
          spec: {
            query: '{}',
            datasource: {
              kind: 'TempoDatasource',
              name: 'tempolocal',
            },
          },
        },
      },
    },
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

export const MOCK_TRACE_SEARCH_RESULT_QUERY_RESULT_EMPTY = [
  {
    status: 'success',
    fetchStatus: 'idle',
    isLoading: false,
    isSuccess: true,
    isError: false,
    data: MOCK_TRACE_SEARCH_RESULT_EMPTY,
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

export const MOCK_TRACE: Trace = {
  rootSpan: {
    resource: {
      serviceName: 'shop-backend',
      attributes: [{ key: 'service.name', value: { stringValue: 'shop-backend' } }],
    },
    scope: { name: 'k6' },
    traceId: 'tid1',
    spanId: 'sid1',
    name: 'testRootSpan',
    kind: 'SPAN_KIND_SERVER',
    startTimeUnixMs: 1000,
    endTimeUnixMs: 2000,
    attributes: [],
    events: [],
    childSpans: [
      {
        resource: {
          serviceName: 'shop-backend',
          attributes: [{ key: 'service.name', value: { stringValue: 'shop-backend' } }],
        },
        scope: { name: 'k6' },
        childSpans: [
          {
            resource: {
              serviceName: 'shop-backend',
              attributes: [{ key: 'service.name', value: { stringValue: 'shop-backend' } }],
            },
            scope: { name: 'k6' },
            childSpans: [],
            traceId: 'tid1',
            spanId: 'sid3',
            parentSpanId: 'sid2',
            name: 'testChildSpan3',
            kind: 'SPAN_KIND_CLIENT',
            startTimeUnixMs: 1300,
            endTimeUnixMs: 1450,
            attributes: [{ key: 'http.method', value: { stringValue: 'PUT' } }],
            events: [],
          },
        ],
        traceId: 'tid1',
        spanId: 'sid2',
        parentSpanId: 'sid1',
        name: 'testChildSpan2',
        kind: 'SPAN_KIND_CLIENT',
        startTimeUnixMs: 1100,
        endTimeUnixMs: 1200,
        attributes: [{ key: 'http.method', value: { stringValue: 'DELETE' } }],
        events: [
          {
            timeUnixMs: 1150,
            name: 'event1_name',
            attributes: [{ key: 'event1_key', value: { stringValue: 'event1_value' } }],
          },
        ],
        status: { message: 'Forbidden', code: 'STATUS_CODE_ERROR' },
      },
    ],
  },
};
addParentReferences(MOCK_TRACE.rootSpan);

export const MOCK_GANTT_TRACE: GanttTrace = {
  rootSpan: MOCK_TRACE.rootSpan,
  startTimeUnixMs: MOCK_TRACE.rootSpan.startTimeUnixMs,
  endTimeUnixMs: MOCK_TRACE.rootSpan.endTimeUnixMs,
};

const MOCK_JAEGER_TRACE_ASYNC: JaegerTrace = {
  traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
  spans: [
    {
      traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
      spanID: 'b93f60c81f2a4ce0',
      operationName: 'script',
      references: [],
      startTime: 1729001599633602,
      duration: 3,
      tags: [
        {
          key: 'span.kind',
          type: 'string',
          value: 'client',
        },
      ],
      logs: [],
      processID: 'p1',
      warnings: [],
      process: {
        serviceName: 'hermes',
        tags: [
          {
            key: 'otel.library.name',
            type: 'string',
            value: 'hermes_client',
          },
          {
            key: 'telemetry.sdk.language',
            type: 'string',
            value: 'cpp',
          },
          {
            key: 'telemetry.sdk.name',
            type: 'string',
            value: 'opentelemetry',
          },
          {
            key: 'telemetry.sdk.version',
            type: 'string',
            value: '1.12.0',
          },
        ],
      },
      relativeStartTime: 0,
      depth: 0,
      hasChildren: true,
      childSpanIds: ['4653459b582b47cb', '8a83db29894c10c4', '0bd40fdf749d38af', '5b6c5367c8f55a07'],
    },
    {
      traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
      spanID: '5b6c5367c8f55a07',
      operationName: 'post1',
      references: [
        {
          refType: 'CHILD_OF',
          traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
          spanID: 'b93f60c81f2a4ce0',
          span: {
            traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
            spanID: 'b93f60c81f2a4ce0',
            operationName: 'script',
            references: [],
            startTime: 1729001599633602,
            duration: 3,
            tags: [
              {
                key: 'span.kind',
                type: 'string',
                value: 'client',
              },
            ],
            logs: [],
            processID: 'p1',
            warnings: [],
            process: {
              serviceName: 'hermes',
              tags: [
                {
                  key: 'otel.library.name',
                  type: 'string',
                  value: 'hermes_client',
                },
                {
                  key: 'telemetry.sdk.language',
                  type: 'string',
                  value: 'cpp',
                },
                {
                  key: 'telemetry.sdk.name',
                  type: 'string',
                  value: 'opentelemetry',
                },
                {
                  key: 'telemetry.sdk.version',
                  type: 'string',
                  value: '1.12.0',
                },
              ],
            },
            relativeStartTime: 0,
            depth: 0,
            hasChildren: true,
            childSpanIds: ['4653459b582b47cb', '8a83db29894c10c4', '0bd40fdf749d38af', '5b6c5367c8f55a07'],
          },
        },
      ],
      startTime: 1729001599633651,
      duration: 3081,
      tags: [
        {
          key: 'http.request.method',
          type: 'string',
          value: 'POST',
        },
        {
          key: 'http.response.status_code',
          type: 'int64',
          value: 200,
        },
        {
          key: 'otel.status_code',
          type: 'string',
          value: 'OK',
        },
        {
          key: 'span.kind',
          type: 'string',
          value: 'client',
        },
        {
          key: 'url.full',
          type: 'string',
          value: 'http://server-mock:8080/url/example/path/id-24',
        },
      ],
      logs: [
        {
          timestamp: 1729001599633766,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Request sent',
            },
          ],
        },
        {
          timestamp: 1729001599636650,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Response received',
            },
          ],
        },
        {
          timestamp: 1729001599636673,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Body received',
            },
          ],
        },
      ],
      processID: 'p1',
      warnings: [],
      process: {
        serviceName: 'hermes',
        tags: [
          {
            key: 'otel.library.name',
            type: 'string',
            value: 'hermes_client',
          },
          {
            key: 'telemetry.sdk.language',
            type: 'string',
            value: 'cpp',
          },
          {
            key: 'telemetry.sdk.name',
            type: 'string',
            value: 'opentelemetry',
          },
          {
            key: 'telemetry.sdk.version',
            type: 'string',
            value: '1.12.0',
          },
        ],
      },
      relativeStartTime: 49,
      depth: 1,
      hasChildren: false,
      childSpanIds: [],
    },
    {
      traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
      spanID: '0bd40fdf749d38af',
      operationName: 'get1',
      references: [
        {
          refType: 'CHILD_OF',
          traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
          spanID: 'b93f60c81f2a4ce0',
          span: {
            traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
            spanID: 'b93f60c81f2a4ce0',
            operationName: 'script',
            references: [],
            startTime: 1729001599633602,
            duration: 3,
            tags: [
              {
                key: 'span.kind',
                type: 'string',
                value: 'client',
              },
            ],
            logs: [],
            processID: 'p1',
            warnings: [],
            process: {
              serviceName: 'hermes',
              tags: [
                {
                  key: 'otel.library.name',
                  type: 'string',
                  value: 'hermes_client',
                },
                {
                  key: 'telemetry.sdk.language',
                  type: 'string',
                  value: 'cpp',
                },
                {
                  key: 'telemetry.sdk.name',
                  type: 'string',
                  value: 'opentelemetry',
                },
                {
                  key: 'telemetry.sdk.version',
                  type: 'string',
                  value: '1.12.0',
                },
              ],
            },
            relativeStartTime: 0,
            depth: 0,
            hasChildren: true,
            childSpanIds: ['4653459b582b47cb', '8a83db29894c10c4', '0bd40fdf749d38af', '5b6c5367c8f55a07'],
          },
        },
      ],
      startTime: 1729001599733700,
      duration: 2719,
      tags: [
        {
          key: 'http.request.method',
          type: 'string',
          value: 'GET',
        },
        {
          key: 'http.response.status_code',
          type: 'int64',
          value: 200,
        },
        {
          key: 'otel.status_code',
          type: 'string',
          value: 'OK',
        },
        {
          key: 'span.kind',
          type: 'string',
          value: 'client',
        },
        {
          key: 'url.full',
          type: 'string',
          value: 'http://server-mock:8080/url/example/path?id=id-24',
        },
      ],
      logs: [
        {
          timestamp: 1729001599733877,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Request sent',
            },
          ],
        },
        {
          timestamp: 1729001599736343,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Response received',
            },
          ],
        },
        {
          timestamp: 1729001599736364,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Body received',
            },
          ],
        },
      ],
      processID: 'p1',
      warnings: [],
      process: {
        serviceName: 'hermes',
        tags: [
          {
            key: 'otel.library.name',
            type: 'string',
            value: 'hermes_client',
          },
          {
            key: 'telemetry.sdk.language',
            type: 'string',
            value: 'cpp',
          },
          {
            key: 'telemetry.sdk.name',
            type: 'string',
            value: 'opentelemetry',
          },
          {
            key: 'telemetry.sdk.version',
            type: 'string',
            value: '1.12.0',
          },
        ],
      },
      relativeStartTime: 100098,
      depth: 1,
      hasChildren: false,
      childSpanIds: [],
    },
    {
      traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
      spanID: '8a83db29894c10c4',
      operationName: 'put1',
      references: [
        {
          refType: 'CHILD_OF',
          traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
          spanID: 'b93f60c81f2a4ce0',
          span: {
            traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
            spanID: 'b93f60c81f2a4ce0',
            operationName: 'script',
            references: [],
            startTime: 1729001599633602,
            duration: 3,
            tags: [
              {
                key: 'span.kind',
                type: 'string',
                value: 'client',
              },
            ],
            logs: [],
            processID: 'p1',
            warnings: [],
            process: {
              serviceName: 'hermes',
              tags: [
                {
                  key: 'otel.library.name',
                  type: 'string',
                  value: 'hermes_client',
                },
                {
                  key: 'telemetry.sdk.language',
                  type: 'string',
                  value: 'cpp',
                },
                {
                  key: 'telemetry.sdk.name',
                  type: 'string',
                  value: 'opentelemetry',
                },
                {
                  key: 'telemetry.sdk.version',
                  type: 'string',
                  value: '1.12.0',
                },
              ],
            },
            relativeStartTime: 0,
            depth: 0,
            hasChildren: true,
            childSpanIds: ['4653459b582b47cb', '8a83db29894c10c4', '0bd40fdf749d38af', '5b6c5367c8f55a07'],
          },
        },
      ],
      startTime: 1729001599833654,
      duration: 2803,
      tags: [
        {
          key: 'http.request.method',
          type: 'string',
          value: 'PUT',
        },
        {
          key: 'http.response.status_code',
          type: 'int64',
          value: 200,
        },
        {
          key: 'otel.status_code',
          type: 'string',
          value: 'OK',
        },
        {
          key: 'span.kind',
          type: 'string',
          value: 'client',
        },
        {
          key: 'url.full',
          type: 'string',
          value: 'http://server-mock:8080/url/example/path/id-24',
        },
      ],
      logs: [
        {
          timestamp: 1729001599833794,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Request sent',
            },
          ],
        },
        {
          timestamp: 1729001599836396,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Response received',
            },
          ],
        },
        {
          timestamp: 1729001599836408,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Body received',
            },
          ],
        },
      ],
      processID: 'p1',
      warnings: [],
      process: {
        serviceName: 'hermes',
        tags: [
          {
            key: 'otel.library.name',
            type: 'string',
            value: 'hermes_client',
          },
          {
            key: 'telemetry.sdk.language',
            type: 'string',
            value: 'cpp',
          },
          {
            key: 'telemetry.sdk.name',
            type: 'string',
            value: 'opentelemetry',
          },
          {
            key: 'telemetry.sdk.version',
            type: 'string',
            value: '1.12.0',
          },
        ],
      },
      relativeStartTime: 200052,
      depth: 1,
      hasChildren: false,
      childSpanIds: [],
    },
    {
      traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
      spanID: '4653459b582b47cb',
      operationName: 'delete1',
      references: [
        {
          refType: 'CHILD_OF',
          traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
          spanID: 'b93f60c81f2a4ce0',
          span: {
            traceID: '7d73f3ae841bf59a74cf5b52a328cfca',
            spanID: 'b93f60c81f2a4ce0',
            operationName: 'script',
            references: [],
            startTime: 1729001599633602,
            duration: 3,
            tags: [
              {
                key: 'span.kind',
                type: 'string',
                value: 'client',
              },
            ],
            logs: [],
            processID: 'p1',
            warnings: [],
            process: {
              serviceName: 'hermes',
              tags: [
                {
                  key: 'otel.library.name',
                  type: 'string',
                  value: 'hermes_client',
                },
                {
                  key: 'telemetry.sdk.language',
                  type: 'string',
                  value: 'cpp',
                },
                {
                  key: 'telemetry.sdk.name',
                  type: 'string',
                  value: 'opentelemetry',
                },
                {
                  key: 'telemetry.sdk.version',
                  type: 'string',
                  value: '1.12.0',
                },
              ],
            },
            relativeStartTime: 0,
            depth: 0,
            hasChildren: true,
            childSpanIds: ['4653459b582b47cb', '8a83db29894c10c4', '0bd40fdf749d38af', '5b6c5367c8f55a07'],
          },
        },
      ],
      startTime: 1729001599944592,
      duration: 20156,
      tags: [
        {
          key: 'http.request.method',
          type: 'string',
          value: 'DELETE',
        },
        {
          key: 'http.response.status_code',
          type: 'int64',
          value: 200,
        },
        {
          key: 'otel.status_code',
          type: 'string',
          value: 'OK',
        },
        {
          key: 'span.kind',
          type: 'string',
          value: 'client',
        },
        {
          key: 'url.full',
          type: 'string',
          value: 'http://server-mock:8080/url/example/path/id-24',
        },
      ],
      logs: [
        {
          timestamp: 1729001599944786,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Request sent',
            },
          ],
        },
        {
          timestamp: 1729001599964619,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Response received',
            },
          ],
        },
        {
          timestamp: 1729001599964650,
          fields: [
            {
              key: 'event',
              type: 'string',
              value: 'Body received',
            },
          ],
        },
      ],
      processID: 'p1',
      warnings: [],
      process: {
        serviceName: 'hermes',
        tags: [
          {
            key: 'otel.library.name',
            type: 'string',
            value: 'hermes_client',
          },
          {
            key: 'telemetry.sdk.language',
            type: 'string',
            value: 'cpp',
          },
          {
            key: 'telemetry.sdk.name',
            type: 'string',
            value: 'opentelemetry',
          },
          {
            key: 'telemetry.sdk.version',
            type: 'string',
            value: '1.12.0',
          },
        ],
      },
      relativeStartTime: 310990,
      depth: 1,
      hasChildren: false,
      childSpanIds: [],
    },
  ],
  processes: {
    p1: {
      serviceName: 'hermes',
      tags: [
        {
          key: 'otel.library.name',
          type: 'string',
          value: 'hermes_client',
        },
        {
          key: 'telemetry.sdk.language',
          type: 'string',
          value: 'cpp',
        },
        {
          key: 'telemetry.sdk.name',
          type: 'string',
          value: 'opentelemetry',
        },
        {
          key: 'telemetry.sdk.version',
          type: 'string',
          value: '1.12.0',
        },
      ],
    },
  },
  warnings: null,
};

export const MOCK_TRACE_ASYNC = parseJaegerTrace(MOCK_JAEGER_TRACE_ASYNC);
