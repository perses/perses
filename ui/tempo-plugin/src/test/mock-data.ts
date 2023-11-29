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

import { TraceData } from '@perses-dev/core';
import { EnrichedTraceQueryResponse } from '../model/api-types';

export const MOCK_ENRICHED_TRACE_QUERY_RESPONSE: EnrichedTraceQueryResponse = {
  query: 'duration > 900ms',
  traces: [
    {
      summary: {
        traceID: '74e7bfe26759d264297a93dfb0c8b06d',
        rootServiceName: 'shop-backend',
        rootTraceName: 'article-to-cart',
        startTimeUnixNano: '1699916836928525000',
        durationMs: 1096,
        spanSets: [
          {
            spans: [
              {
                spanID: '0c6b860f6e224789',
                startTimeUnixNano: '1699916836928525000',
                durationNanos: '1096680907',
              },
            ],
            matched: 1,
          },
        ],
      },
      traceDetails: {
        batches: [
          {
            resource: {
              attributes: [
                {
                  key: 'k6',
                  value: {
                    stringValue: 'true',
                  },
                },
                {
                  key: 'service.name',
                  value: {
                    stringValue: 'shop-backend',
                  },
                },
              ],
            },
            scopeSpans: [
              {
                scope: {
                  name: 'k6',
                },
                spans: [
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: 'DGuGD24iR4k=',
                    name: 'article-to-cart',
                    kind: 'SPAN_KIND_SERVER',
                    startTimeUnixNano: '1699916836928525000',
                    endTimeUnixNano: '1699916838025205907',
                    attributes: [
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.sock.host.addr',
                        value: {
                          stringValue: '192.168.173.158',
                        },
                      },
                      {
                        key: 'net.host.name',
                        value: {
                          stringValue: 'shop-backend.local',
                        },
                      },
                      {
                        key: 'net.host.port',
                        value: {
                          intValue: '8978',
                        },
                      },
                      {
                        key: 'http.flavor',
                        value: {
                          stringValue: '1.1',
                        },
                      },
                      {
                        key: 'http.scheme',
                        value: {
                          stringValue: 'https',
                        },
                      },
                      {
                        key: 'http.target',
                        value: {
                          stringValue: '/article-to-cart',
                        },
                      },
                      {
                        key: 'http.response_content_length',
                        value: {
                          intValue: '805912',
                        },
                      },
                      {
                        key: 'http.method',
                        value: {
                          stringValue: 'DELETE',
                        },
                      },
                      {
                        key: 'http.url',
                        value: {
                          stringValue: 'https://shop-backend.local:8978/article-to-cart',
                        },
                      },
                      {
                        key: 'http.status_code',
                        value: {
                          intValue: '204',
                        },
                      },
                    ],
                    status: {},
                  },
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: '7lmlnBwmIgg=',
                    parentSpanId: 'DGuGD24iR4k=',
                    name: 'authenticate',
                    kind: 'SPAN_KIND_CLIENT',
                    startTimeUnixNano: '1699916837006096365',
                    endTimeUnixNano: '1699916837118459172',
                    attributes: [
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.peer.port',
                        value: {
                          intValue: '8317',
                        },
                      },
                      {
                        key: 'http.flavor',
                        value: {
                          stringValue: '1.1',
                        },
                      },
                      {
                        key: 'net.sock.peer.addr',
                        value: {
                          stringValue: '192.168.17.171',
                        },
                      },
                      {
                        key: 'net.peer.name',
                        value: {
                          stringValue: 'auth-service.local',
                        },
                      },
                      {
                        key: 'http.response_content_length',
                        value: {
                          intValue: '722194',
                        },
                      },
                      {
                        key: 'http.method',
                        value: {
                          stringValue: 'PUT',
                        },
                      },
                      {
                        key: 'http.url',
                        value: {
                          stringValue: 'https://auth-service.local:8489/authenticate',
                        },
                      },
                      {
                        key: 'http.status_code',
                        value: {
                          intValue: '204',
                        },
                      },
                    ],
                    status: {},
                  },
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: 'oEoYzmxhmE8=',
                    parentSpanId: 'DGuGD24iR4k=',
                    name: 'get-article',
                    kind: 'SPAN_KIND_CLIENT',
                    startTimeUnixNano: '1699916837010142058',
                    endTimeUnixNano: '1699916837606440936',
                    attributes: [
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.peer.port',
                        value: {
                          intValue: '8384',
                        },
                      },
                      {
                        key: 'http.flavor',
                        value: {
                          stringValue: '1.1',
                        },
                      },
                      {
                        key: 'net.sock.peer.addr',
                        value: {
                          stringValue: '192.168.234.29',
                        },
                      },
                      {
                        key: 'net.peer.name',
                        value: {
                          stringValue: 'article-service.local',
                        },
                      },
                      {
                        key: 'http.response_content_length',
                        value: {
                          intValue: '601099',
                        },
                      },
                      {
                        key: 'http.method',
                        value: {
                          stringValue: 'PATCH',
                        },
                      },
                      {
                        key: 'http.url',
                        value: {
                          stringValue: 'https://article-service.local:8800/get-article',
                        },
                      },
                      {
                        key: 'http.status_code',
                        value: {
                          intValue: '204',
                        },
                      },
                    ],
                    status: {},
                  },
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: '0EwFKq12nDc=',
                    parentSpanId: 'DGuGD24iR4k=',
                    name: 'place-articles',
                    kind: 'SPAN_KIND_CLIENT',
                    startTimeUnixNano: '1699916837032400018',
                    endTimeUnixNano: '1699916837731389390',
                    attributes: [
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.peer.port',
                        value: {
                          intValue: '8286',
                        },
                      },
                      {
                        key: 'http.flavor',
                        value: {
                          stringValue: '1.1',
                        },
                      },
                      {
                        key: 'net.sock.peer.addr',
                        value: {
                          stringValue: '192.168.27.161',
                        },
                      },
                      {
                        key: 'net.peer.name',
                        value: {
                          stringValue: 'cart-service.local',
                        },
                      },
                      {
                        key: 'http.response_content_length',
                        value: {
                          intValue: '175827',
                        },
                      },
                      {
                        key: 'http.method',
                        value: {
                          stringValue: 'GET',
                        },
                      },
                      {
                        key: 'http.url',
                        value: {
                          stringValue: 'https://cart-service.local:8592/place-articles',
                        },
                      },
                      {
                        key: 'http.status_code',
                        value: {
                          intValue: '201',
                        },
                      },
                    ],
                    status: {},
                  },
                ],
              },
            ],
          },
          {
            resource: {
              attributes: [
                {
                  key: 'k6',
                  value: {
                    stringValue: 'true',
                  },
                },
                {
                  key: 'service.name',
                  value: {
                    stringValue: 'auth-service',
                  },
                },
              ],
            },
            scopeSpans: [
              {
                scope: {
                  name: 'k6',
                },
                spans: [
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: 'whoMr/ckps4=',
                    parentSpanId: '7lmlnBwmIgg=',
                    name: 'authenticate',
                    kind: 'SPAN_KIND_SERVER',
                    startTimeUnixNano: '1699916837012281235',
                    endTimeUnixNano: '1699916837093651916',
                    attributes: [
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.sock.host.addr',
                        value: {
                          stringValue: '192.168.17.171',
                        },
                      },
                      {
                        key: 'net.host.name',
                        value: {
                          stringValue: 'auth-service.local',
                        },
                      },
                      {
                        key: 'net.host.port',
                        value: {
                          intValue: '8489',
                        },
                      },
                      {
                        key: 'http.flavor',
                        value: {
                          stringValue: '1.1',
                        },
                      },
                      {
                        key: 'http.scheme',
                        value: {
                          stringValue: 'https',
                        },
                      },
                      {
                        key: 'http.target',
                        value: {
                          stringValue: '/authenticate',
                        },
                      },
                      {
                        key: 'http.response_content_length',
                        value: {
                          intValue: '722194',
                        },
                      },
                      {
                        key: 'http.request_content_length',
                        value: {
                          intValue: '23247',
                        },
                      },
                      {
                        key: 'http.method',
                        value: {
                          stringValue: 'PUT',
                        },
                      },
                      {
                        key: 'http.url',
                        value: {
                          stringValue: 'https://auth-service.local:8489/authenticate',
                        },
                      },
                      {
                        key: 'http.status_code',
                        value: {
                          intValue: '204',
                        },
                      },
                    ],
                    status: {},
                  },
                ],
              },
            ],
          },
          {
            resource: {
              attributes: [
                {
                  key: 'k6',
                  value: {
                    stringValue: 'true',
                  },
                },
                {
                  key: 'service.name',
                  value: {
                    stringValue: 'article-service',
                  },
                },
              ],
            },
            scopeSpans: [
              {
                scope: {
                  name: 'k6',
                },
                spans: [
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: '8laO4qPxfNw=',
                    parentSpanId: 'oEoYzmxhmE8=',
                    name: 'get-article',
                    kind: 'SPAN_KIND_SERVER',
                    startTimeUnixNano: '1699916837059186218',
                    endTimeUnixNano: '1699916837485309645',
                    attributes: [
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.sock.host.addr',
                        value: {
                          stringValue: '192.168.234.29',
                        },
                      },
                      {
                        key: 'net.host.name',
                        value: {
                          stringValue: 'article-service.local',
                        },
                      },
                      {
                        key: 'net.host.port',
                        value: {
                          intValue: '8800',
                        },
                      },
                      {
                        key: 'http.flavor',
                        value: {
                          stringValue: '1.1',
                        },
                      },
                      {
                        key: 'http.scheme',
                        value: {
                          stringValue: 'https',
                        },
                      },
                      {
                        key: 'http.target',
                        value: {
                          stringValue: '/get-article',
                        },
                      },
                      {
                        key: 'http.response_content_length',
                        value: {
                          intValue: '601099',
                        },
                      },
                      {
                        key: 'http.request_content_length',
                        value: {
                          intValue: '28316',
                        },
                      },
                      {
                        key: 'http.method',
                        value: {
                          stringValue: 'PATCH',
                        },
                      },
                      {
                        key: 'http.url',
                        value: {
                          stringValue: 'https://article-service.local:8800/get-article',
                        },
                      },
                      {
                        key: 'http.status_code',
                        value: {
                          intValue: '204',
                        },
                      },
                    ],
                    status: {},
                  },
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: 'A797BwdTH70=',
                    parentSpanId: '8laO4qPxfNw=',
                    name: 'select-articles',
                    kind: 'SPAN_KIND_CLIENT',
                    startTimeUnixNano: '1699916837094286408',
                    endTimeUnixNano: '1699916837381223992',
                    attributes: [
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.peer.port',
                        value: {
                          intValue: '8625',
                        },
                      },
                      {
                        key: 'net.sock.peer.addr',
                        value: {
                          stringValue: '192.168.110.19',
                        },
                      },
                      {
                        key: 'net.peer.name',
                        value: {
                          stringValue: 'postgres.local',
                        },
                      },
                    ],
                    status: {},
                  },
                ],
              },
            ],
          },
          {
            resource: {
              attributes: [
                {
                  key: 'k6',
                  value: {
                    stringValue: 'true',
                  },
                },
                {
                  key: 'service.name',
                  value: {
                    stringValue: 'cart-service',
                  },
                },
              ],
            },
            scopeSpans: [
              {
                scope: {
                  name: 'k6',
                },
                spans: [
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: 'JmXqG1XneLo=',
                    parentSpanId: '0EwFKq12nDc=',
                    name: 'place-articles',
                    kind: 'SPAN_KIND_SERVER',
                    startTimeUnixNano: '1699916837087434619',
                    endTimeUnixNano: '1699916837508697650',
                    attributes: [
                      {
                        key: 'article.count',
                        value: {
                          intValue: '1',
                        },
                      },
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.sock.host.addr',
                        value: {
                          stringValue: '192.168.27.161',
                        },
                      },
                      {
                        key: 'net.host.name',
                        value: {
                          stringValue: 'cart-service.local',
                        },
                      },
                      {
                        key: 'net.host.port',
                        value: {
                          intValue: '8592',
                        },
                      },
                      {
                        key: 'http.flavor',
                        value: {
                          stringValue: '1.1',
                        },
                      },
                      {
                        key: 'http.scheme',
                        value: {
                          stringValue: 'https',
                        },
                      },
                      {
                        key: 'http.target',
                        value: {
                          stringValue: '/place-articles',
                        },
                      },
                      {
                        key: 'http.response_content_length',
                        value: {
                          intValue: '175827',
                        },
                      },
                      {
                        key: 'http.method',
                        value: {
                          stringValue: 'GET',
                        },
                      },
                      {
                        key: 'http.url',
                        value: {
                          stringValue: 'https://cart-service.local:8592/place-articles',
                        },
                      },
                      {
                        key: 'http.status_code',
                        value: {
                          intValue: '201',
                        },
                      },
                    ],
                    status: {},
                  },
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: 'peUi5+rBEYs=',
                    parentSpanId: 'JmXqG1XneLo=',
                    name: 'persist-cart',
                    kind: 'SPAN_KIND_INTERNAL',
                    startTimeUnixNano: '1699916837110379314',
                    endTimeUnixNano: '1699916837488202163',
                    status: {},
                  },
                ],
              },
            ],
          },
          {
            resource: {
              attributes: [
                {
                  key: 'k6',
                  value: {
                    stringValue: 'true',
                  },
                },
                {
                  key: 'service.name',
                  value: {
                    stringValue: 'postgres',
                  },
                },
              ],
            },
            scopeSpans: [
              {
                scope: {
                  name: 'k6',
                },
                spans: [
                  {
                    traceId: 'dOe/4mdZ0mQpepPfsMiwbQ==',
                    spanId: 'N3suWDPcNRY=',
                    parentSpanId: 'A797BwdTH70=',
                    name: 'query-articles',
                    kind: 'SPAN_KIND_SERVER',
                    startTimeUnixNano: '1699916837113120083',
                    endTimeUnixNano: '1699916837338243639',
                    attributes: [
                      {
                        key: 'k6.8jLWDJgSSF6wVm8',
                        value: {
                          stringValue: 'y5naYgdk359gW2kf6YrGu5HikcxzA8',
                        },
                      },
                      {
                        key: 'k6.D9x9C1GGGu0Hxr0',
                        value: {
                          stringValue: 'izaIo87Ru8pHzN6FhQqQrYQ2rJr7fW',
                        },
                      },
                      {
                        key: 'net.transport',
                        value: {
                          stringValue: 'ip_tcp',
                        },
                      },
                      {
                        key: 'net.sock.family',
                        value: {
                          stringValue: 'inet',
                        },
                      },
                      {
                        key: 'net.sock.host.addr',
                        value: {
                          stringValue: '192.168.110.19',
                        },
                      },
                      {
                        key: 'net.host.name',
                        value: {
                          stringValue: 'postgres.local',
                        },
                      },
                      {
                        key: 'net.host.port',
                        value: {
                          intValue: '8757',
                        },
                      },
                    ],
                    status: {},
                  },
                ],
              },
            ],
          },
        ],
      },
      spanCount: 10,
      errorCount: 0,
    },
  ],
};

export const MOCK_TRACE_DATA: TraceData = {
  traces: [
    {
      startTimeUnixMs: 1699916836928525,
      durationMs: 1096,
      spanCount: 10,
      errorCount: 0,
      traceId: '74e7bfe26759d264297a93dfb0c8b06d',
      name: 'rootServiceName="shop-backend", rootTraceName="shop-backend"',
    },
  ],
  metadata: { executedQueryString: 'duration > 900ms' },
};
