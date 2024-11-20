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
import { QueryResponse, SearchResponse } from '../model/api-types';

function addParentReferences(span: Span) {
  for (const child of span.childSpans) {
    child.parentSpan = span;
    addParentReferences(child);
  }
}

export const MOCK_TRACE_RESPONSE: QueryResponse = {
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
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'nCLrd8tcFMc=',
              name: 'article-to-cart',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1718122135898442804',
              endTimeUnixNano: '1718122136696651946',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
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
                    stringValue: '192.168.178.78',
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
                    intValue: '8523',
                  },
                },
                {
                  key: 'http.flavor',
                  value: {
                    stringValue: '1.1',
                  },
                },
                {
                  key: 'http.response.header.content-type',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'application/json',
                        },
                      ],
                    },
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
                    intValue: '798964',
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
                    stringValue: 'https://shop-backend.local:8523/article-to-cart',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '202',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136121852899',
                  name: 'event_k6.NatYZCF1v6',
                  attributes: [
                    {
                      key: 'k6.vRlB3IwcJgPdes2',
                      value: {
                        stringValue: 'bx4L0E7Xun1cHFa2VBcJn9NZ7uD5up',
                      },
                    },
                    {
                      key: 'k6.e6PRrGoq3Sa0gLJ',
                      value: {
                        stringValue: 'C4vQHnkSsTpLrm7wqCADIG06SrOYJH',
                      },
                    },
                    {
                      key: 'k6.p4RmGEu0yfG1ysn',
                      value: {
                        stringValue: 'ngqd7T3ca52vKwWjcbX2POxyRU3syb',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122135959148791',
                  name: 'event_k6.dhqI1KzgcG',
                  attributes: [
                    {
                      key: 'k6.8ZSxlGYQMpdtsb2',
                      value: {
                        stringValue: 'f1s5FaaXAjO7RwX9cJzg7o02fxCqYn',
                      },
                    },
                    {
                      key: 'k6.dwykekSkUbmNpbm',
                      value: {
                        stringValue: 'fXcViA4rTQIhH7b5gPqg2IHfyu3JIr',
                      },
                    },
                    {
                      key: 'k6.ao5Id3Am3ODvEcu',
                      value: {
                        stringValue: 'F98r8VLUBAVQuGlWyRnE04vkX4afnO',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136535757542',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.MI6I5eznGjjWV67pZXTV',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\nmain.main()',
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.J2JsFeiTDN',
                      },
                    },
                    {
                      key: 'k6.b5N57NHFwBy6NeA',
                      value: {
                        stringValue: 'RkxSWkFgRL438NkhrSbOVpEtjlRA5z',
                      },
                    },
                    {
                      key: 'k6.ZI1ihTktVIpf07N',
                      value: {
                        stringValue: 'jCQJpwoLprXVK9gmY92Gv5P6JGIqfN',
                      },
                    },
                    {
                      key: 'k6.aGENTrz8xteROR0',
                      value: {
                        stringValue: '982UX22GsdRtc0LJ51AvcNF60B6h1y',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'hGe8oRN3wWY=',
              parentSpanId: 'nCLrd8tcFMc=',
              name: 'authenticate',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1718122135954765948',
              endTimeUnixNano: '1718122136154227489',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
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
                  key: 'net.peer.port',
                  value: {
                    intValue: '8615',
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
                    stringValue: '192.168.80.125',
                  },
                },
                {
                  key: 'net.peer.name',
                  value: {
                    stringValue: 'auth-service.local',
                  },
                },
                {
                  key: 'http.request.header.accept',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'text/html',
                        },
                      ],
                    },
                  },
                },
                {
                  key: 'http.response_content_length',
                  value: {
                    intValue: '161675',
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
                    stringValue: 'https://auth-service.local:8322/authenticate',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '202',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136068613856',
                  name: 'event_k6.7W272ywYih',
                  attributes: [
                    {
                      key: 'k6.sJekvnAr5h7vJfK',
                      value: {
                        stringValue: 'SZ9vwpLkAzAm2Bju1VJroUlGD8u3pS',
                      },
                    },
                    {
                      key: 'k6.81JLO5NlT1lAeF1',
                      value: {
                        stringValue: '4AzrPTOML11aIN3dYgbKSaAe9HErnZ',
                      },
                    },
                    {
                      key: 'k6.tdj0bfOxLndyJuN',
                      value: {
                        stringValue: 'PeMAsdQ5469IjQgGtifBA7OgfFdoMb',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136095265320',
                  name: 'event_k6.KCZc8Ro6UP',
                  attributes: [
                    {
                      key: 'k6.NAn98VlCTpIgjdr',
                      value: {
                        stringValue: 'VMbkD6Pnn2AJW2coVczCfiW0Lvp0AL',
                      },
                    },
                    {
                      key: 'k6.ECtNrkLMxtxm6Lv',
                      value: {
                        stringValue: 'nle5O4vANrB7gPw3ZbvpQpsT0pWOvX',
                      },
                    },
                    {
                      key: 'k6.SDlhZuXOjrv0n2d',
                      value: {
                        stringValue: 'fI9fkYPaE2fKkKiBPFWbsNIkE9YMEy',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122135959614494',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.549QHAUnvmJqcORGZpTl',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\npayment.collect()',
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.ndxfJIt3Q8',
                      },
                    },
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'k6.hx7eN6MvcsDrZbu',
                      value: {
                        stringValue: 'yq7cjJi6pCHXCQULbnr2zemQiD4sDD',
                      },
                    },
                    {
                      key: 'k6.0vrHzWQOLZe4CFL',
                      value: {
                        stringValue: 'cYlTmNgj6nRsvgaSL3glGcCQTZ5x0w',
                      },
                    },
                    {
                      key: 'k6.j0vPrk42aKgAn6M',
                      value: {
                        stringValue: '9iT9xHqHXD7CTLDt68xpXvaow4oANP',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'r2NxHHPjciM=',
              parentSpanId: 'nCLrd8tcFMc=',
              name: 'get-article',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1718122135965210897',
              endTimeUnixNano: '1718122136520157839',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
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
                  key: 'net.peer.port',
                  value: {
                    intValue: '8834',
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
                    stringValue: '192.168.40.73',
                  },
                },
                {
                  key: 'net.peer.name',
                  value: {
                    stringValue: 'article-service.local',
                  },
                },
                {
                  key: 'http.request.header.accept',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'application/x-www-form-urlencoded',
                        },
                      ],
                    },
                  },
                },
                {
                  key: 'http.response_content_length',
                  value: {
                    intValue: '840071',
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
                    stringValue: 'https://article-service.local:8146/get-article',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '202',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136095880853',
                  name: 'event_k6.esi0tvI52F',
                  attributes: [
                    {
                      key: 'k6.tlJUCbFg8xUyqBn',
                      value: {
                        stringValue: 'fPCoKtVMdrjd6U4fzn8zUlxnCKCFZ6',
                      },
                    },
                    {
                      key: 'k6.23yKJaHpSpPaFlf',
                      value: {
                        stringValue: 'TXUnXU0kJVYv6gVKV8uAwDb1SEFh5F',
                      },
                    },
                    {
                      key: 'k6.941Ut337TRmxSZY',
                      value: {
                        stringValue: 'TQw39BLyz0gOiklICoP01avxjCup8B',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136251990539',
                  name: 'event_k6.ak6z7aVhHz',
                  attributes: [
                    {
                      key: 'k6.U0xUmWwMkCKvgDr',
                      value: {
                        stringValue: 'KPBjWYRkXlE7WgIGfetcWwzYNOh3Dg',
                      },
                    },
                    {
                      key: 'k6.Ae1hEmw6fHfzGvN',
                      value: {
                        stringValue: 'JuORXGGEYpqKfueJQH6hEZ6dEzPYbn',
                      },
                    },
                    {
                      key: 'k6.mXspZ65CGfDXPTl',
                      value: {
                        stringValue: '8FOzwZNpaQsqFkPiXBkCVGcjjxdEJi',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122135981029446',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.lDiv3BJzpVrRohNvd5iX',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\npayment.collect()',
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.cnB8FMWj0O',
                      },
                    },
                    {
                      key: 'k6.rzjx1Jb3nP3lx0j',
                      value: {
                        stringValue: 'NFag7Ie3d9CUp7IK6K8uQDtdbwqIgW',
                      },
                    },
                    {
                      key: 'k6.VipfBYYIE7TAoyv',
                      value: {
                        stringValue: '2FLijaW07hlifYiSd54zKCa8Rg1AGQ',
                      },
                    },
                    {
                      key: 'k6.KZ033g2dDKYI1DZ',
                      value: {
                        stringValue: 'toU991pl3dLDI7Uo2ncZfCpbex7afr',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'R5+h4rUGjAg=',
              parentSpanId: 'nCLrd8tcFMc=',
              name: 'place-articles',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1718122135966028415',
              endTimeUnixNano: '1718122136475626506',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
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
                  key: 'net.peer.port',
                  value: {
                    intValue: '8154',
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
                    stringValue: '192.168.129.185',
                  },
                },
                {
                  key: 'net.peer.name',
                  value: {
                    stringValue: 'cart-service.local',
                  },
                },
                {
                  key: 'http.request.header.accept',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'application/json',
                        },
                      ],
                    },
                  },
                },
                {
                  key: 'http.response_content_length',
                  value: {
                    intValue: '751980',
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
                    stringValue: 'https://cart-service.local:8569/place-articles',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '201',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136123608866',
                  name: 'event_k6.3Sryhmkta7',
                  attributes: [
                    {
                      key: 'k6.V5xiLax3uVsNdKW',
                      value: {
                        stringValue: 'A2Z2c4PayyYkcRE3YxvDCjhT90NUHA',
                      },
                    },
                    {
                      key: 'k6.xUgJMfnYCwkQcqi',
                      value: {
                        stringValue: 'krepg7b6G2T1mf4WSlzT05rItbnVXp',
                      },
                    },
                    {
                      key: 'k6.X9HgfnyYqrKUEAQ',
                      value: {
                        stringValue: 'M4Hk8n5goVVebPFPLUJjhQ7Go2jvpu',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136189408794',
                  name: 'event_k6.XHavEme9S9',
                  attributes: [
                    {
                      key: 'k6.At33Eb93zvfBqEM',
                      value: {
                        stringValue: 'xHYSOyuxwN2wumQXWfKLhYlHSZDdFR',
                      },
                    },
                    {
                      key: 'k6.PbSywD5KKD8FP3R',
                      value: {
                        stringValue: '8x2xinELQChu9I8wpwnIBnuLLTsITv',
                      },
                    },
                    {
                      key: 'k6.DMloaUzuVFyYz71',
                      value: {
                        stringValue: 'iYwGwzl399dn9cQ4xmY4v3XEF3vNn7',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136349567897',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.sG5d4qdkE11RLcbWQk7l',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: "panic: runtime error: can't divide by 0\ntrace.makespan()",
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.8PslAmJ3dT',
                      },
                    },
                    {
                      key: 'k6.oF87iXjIiW1H0fO',
                      value: {
                        stringValue: '0TuahfA9Ss3kqKJc5iIXjqbhvTp7Jj',
                      },
                    },
                    {
                      key: 'k6.iMi4DvfLOcMNhbH',
                      value: {
                        stringValue: 'pDeruWs4qBI2c29fP4yEawwvwo7t5n',
                      },
                    },
                    {
                      key: 'k6.iDspSFE5Cl8nwtI',
                      value: {
                        stringValue: 'WK80HnveOFl1TeUPeaLKhsm8aaseam',
                      },
                    },
                  ],
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
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'AYBIFdTlycc=',
              parentSpanId: 'hGe8oRN3wWY=',
              name: 'authenticate',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1718122135970602296',
              endTimeUnixNano: '1718122136107740742',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
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
                    stringValue: '192.168.80.125',
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
                    intValue: '8322',
                  },
                },
                {
                  key: 'http.flavor',
                  value: {
                    stringValue: '1.1',
                  },
                },
                {
                  key: 'http.response.header.content-type',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'text/html',
                        },
                      ],
                    },
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
                    intValue: '161675',
                  },
                },
                {
                  key: 'http.request_content_length',
                  value: {
                    intValue: '15814',
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
                    stringValue: 'https://auth-service.local:8322/authenticate',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '202',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122135973731314',
                  name: 'event_k6.GEhccAnJok',
                  attributes: [
                    {
                      key: 'k6.T1JWJOTGQNuwucm',
                      value: {
                        stringValue: 'nsKwcTlJQCLKKAXfPOgOQDvxKjv3Tw',
                      },
                    },
                    {
                      key: 'k6.YW0obYcWNxBnjjG',
                      value: {
                        stringValue: 'EzvYbpCZ8ghjO9a85AttpuYSApFRfu',
                      },
                    },
                    {
                      key: 'k6.iwBzfbLvohAouYJ',
                      value: {
                        stringValue: '409XTWEnYj3v3AwRoqdgBy6btNKAyT',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122135992251805',
                  name: 'event_k6.gm85YbCvpm',
                  attributes: [
                    {
                      key: 'k6.MtcuboSMDlSE4sp',
                      value: {
                        stringValue: 'f2nN1sAFSqO82mCG83KHnivWbvemq4',
                      },
                    },
                    {
                      key: 'k6.pMci576PvAe4SXX',
                      value: {
                        stringValue: 'Q0LHIU7S9eWlk58l7NCCyUn9Cbvucs',
                      },
                    },
                    {
                      key: 'k6.D6WBQBa3H3GZBMU',
                      value: {
                        stringValue: 'Bii98Iz53cmOvjX6xO1zOH8LigOKxx',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136053892329',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.nQlVyfS8ug7OrbniR6U0',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: "panic: runtime error: can't divide by 0\nmain.main()",
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.bto3zuQex2',
                      },
                    },
                    {
                      key: 'k6.YJyP1LIuGX375b9',
                      value: {
                        stringValue: '9aOfrSQ3dnswtqA7NA9aSFzUr3Q9tg',
                      },
                    },
                    {
                      key: 'k6.eSrLSO4oYbaJ0fw',
                      value: {
                        stringValue: 'glKpJznQsZCDX7QVHBCS1nE0zNk6ZE',
                      },
                    },
                    {
                      key: 'k6.jfIgcZAEcX26te9',
                      value: {
                        stringValue: 'KHtYcZiyJ4WYJDkEGtf8c88v6nAhPU',
                      },
                    },
                  ],
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
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'd7ckd3aNLyo=',
              parentSpanId: 'r2NxHHPjciM=',
              name: 'get-article',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1718122135995640399',
              endTimeUnixNano: '1718122136347061543',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
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
                    stringValue: '192.168.40.73',
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
                    intValue: '8146',
                  },
                },
                {
                  key: 'http.flavor',
                  value: {
                    stringValue: '1.1',
                  },
                },
                {
                  key: 'http.response.header.content-type',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'application/x-www-form-urlencoded',
                        },
                      ],
                    },
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
                    intValue: '840071',
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
                    stringValue: 'https://article-service.local:8146/get-article',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '202',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136058281752',
                  name: 'event_k6.QaCoyeuyO2',
                  attributes: [
                    {
                      key: 'k6.2vFHMgf0JqdEQQ0',
                      value: {
                        stringValue: 'XU0LWwsh6qhm3eEslrFl06RTgyCcFI',
                      },
                    },
                    {
                      key: 'k6.Y6ADBqcOTJENhXY',
                      value: {
                        stringValue: '8GGtoIzZb9K1NfnIvguVYKkK7oHk9Z',
                      },
                    },
                    {
                      key: 'k6.ogCoDkhK5UKNbk3',
                      value: {
                        stringValue: 'NO6e09bLJ0F6nogOzJJ1HbBqEheRBj',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136112385367',
                  name: 'event_k6.J6YoJTTxWK',
                  attributes: [
                    {
                      key: 'k6.4BS0WAdGEOgHOBQ',
                      value: {
                        stringValue: 'FoySu3YOfbP4QSjcsC7KtF2cjQPOZ3',
                      },
                    },
                    {
                      key: 'k6.k0bKV9rjRBCe9ZR',
                      value: {
                        stringValue: 'KAgIztMuROn2nArmJpH5tMMYzWYby0',
                      },
                    },
                    {
                      key: 'k6.W5y1HG831ooasln',
                      value: {
                        stringValue: '4RmrSGgD7yKgn3mhFPD37o7n4ZWo7T',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136203641571',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.D3gOy3QvVkTbYgSaCYPp',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\ntrace.makespan()',
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.r86MZys2p8',
                      },
                    },
                    {
                      key: 'k6.T6Dia09arSO0X8K',
                      value: {
                        stringValue: 'YF47Zo9kzOhhIR2XrQXQ2ksabd3Gab',
                      },
                    },
                    {
                      key: 'k6.4JTG1iw7rFcS4Ju',
                      value: {
                        stringValue: 'pyvkkWsqXuhwlmdnpYpsXPglpquelS',
                      },
                    },
                    {
                      key: 'k6.ynJ9WO2xBQdJ5HY',
                      value: {
                        stringValue: '25mtvH6QCUgorKQCsjD3KCKsfmB5bF',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'ey6qRxofJmc=',
              parentSpanId: 'd7ckd3aNLyo=',
              name: 'select-articles',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1718122136029615583',
              endTimeUnixNano: '1718122136253492513',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
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
                  key: 'net.peer.port',
                  value: {
                    intValue: '8803',
                  },
                },
                {
                  key: 'net.sock.peer.addr',
                  value: {
                    stringValue: '192.168.195.79',
                  },
                },
                {
                  key: 'net.peer.name',
                  value: {
                    stringValue: 'postgres.local',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136100198855',
                  name: 'event_k6.bTjxPkehda',
                  attributes: [
                    {
                      key: 'k6.cHxu9QKdcjw61cH',
                      value: {
                        stringValue: '9BOtyHe60cPmnAAyx5OLf7HUkkyGVu',
                      },
                    },
                    {
                      key: 'k6.z4mxHOF9lH4cWym',
                      value: {
                        stringValue: 'ewYXEMWx5rXEEV7qBsEt0gMSnFcprS',
                      },
                    },
                    {
                      key: 'k6.vQmJvoh0YU75MTq',
                      value: {
                        stringValue: 'DogsPXKbGpsDalcLGlXGwKWL5ykAMQ',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136036190109',
                  name: 'event_k6.FhoqGTeALJ',
                  attributes: [
                    {
                      key: 'k6.eQSVasGUkFmo4BU',
                      value: {
                        stringValue: 'tEpJ7jT8Zu64rS1jXKiftt8fBwMr1H',
                      },
                    },
                    {
                      key: 'k6.ooZC6oqEbDOuDkd',
                      value: {
                        stringValue: 'ul3MQpEQlyMO5QAQhQaPyFhKjVgyS2',
                      },
                    },
                    {
                      key: 'k6.eb2xT8J9lfDMRhR',
                      value: {
                        stringValue: 'zhm0w9E5d0JBcovyRXcEgbXuYHhKcw',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136053896641',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.5ymfEHCaUejvd7EYMVR6',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\ntrace.makespan()',
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.YgJGYyT4ZP',
                      },
                    },
                    {
                      key: 'k6.s4QwdDpX8xbP7qg',
                      value: {
                        stringValue: 'Y8WGayIe0GkUrlMGSzS0Gf1OsLvh5D',
                      },
                    },
                    {
                      key: 'k6.sddK8EDlFSl8uGQ',
                      value: {
                        stringValue: 'wAqAehAhurbu4JIAyAwFx94tczIbpW',
                      },
                    },
                    {
                      key: 'k6.Ho5hjf6ryokivDL',
                      value: {
                        stringValue: 'G48irDeGwDhOz985G8L5qjigaZSdKK',
                      },
                    },
                  ],
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
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'K60RcdOZ/A0=',
              parentSpanId: 'ey6qRxofJmc=',
              name: 'query-articles',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1718122136041528783',
              endTimeUnixNano: '1718122136210517760',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
                  },
                },
                {
                  key: 'k6.h4Cb9ao1B9ACcTx',
                  value: {
                    stringValue: 'uMVyp4sTRHwsmEIyA0JcmZ5s3KTFGv',
                  },
                },
                {
                  key: 'k6.bTvlPcLlmIIoIhz',
                  value: {
                    stringValue: 'Js8oMWskWDstC8q1bH0BjpdaxZJHvR',
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
                    stringValue: '192.168.195.79',
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
                    intValue: '8523',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136128896049',
                  name: 'event_k6.HxNJp7wrtw',
                  attributes: [
                    {
                      key: 'k6.YyMj5iOPD3FN8H9',
                      value: {
                        stringValue: '7OGVPJmS6UdIKlqpZhB4XhwjasZ72R',
                      },
                    },
                    {
                      key: 'k6.RY9hKEnGmOYzB4W',
                      value: {
                        stringValue: '5E89roYYhl5KLvoTAnHmVtjZiOckoa',
                      },
                    },
                    {
                      key: 'k6.B0PGwsQsRMofoRe',
                      value: {
                        stringValue: 'zm0G1wyExyEBsGohzCTrUF94qz9IpC',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136106174905',
                  name: 'event_k6.ffJnb3eRnS',
                  attributes: [
                    {
                      key: 'k6.SJP3bOKT9lhNwMo',
                      value: {
                        stringValue: '7mFoXQBwmSLuirUHcTMa1lwlDJmW7C',
                      },
                    },
                    {
                      key: 'k6.dotaZmeMHFTSp3K',
                      value: {
                        stringValue: 'A3EHnd11QgTwFWLGRuvozbQbYo6qGL',
                      },
                    },
                    {
                      key: 'k6.tapw2o0UwOIltQ0',
                      value: {
                        stringValue: 'n2aKsqMfwI8Jscfxlo1N1UPnnS8faM',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136142550112',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: "panic: runtime error: can't divide by 0\ntrace.makespan()",
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.SRpBYt5TW3',
                      },
                    },
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.dRIcyvphT9gmCO6OUWMS',
                      },
                    },
                    {
                      key: 'k6.AcaH1QyTXB7pgvX',
                      value: {
                        stringValue: 'b4ucnpk3Pe0pzMtuBZfZMGbZGUarsY',
                      },
                    },
                    {
                      key: 'k6.coZHMs3RqE3uUmO',
                      value: {
                        stringValue: 'WnEKZI0KmL8VSo0N954et4EKphAeuL',
                      },
                    },
                    {
                      key: 'k6.5h5AwuG29rFl0TZ',
                      value: {
                        stringValue: 'OBavPbd11dnhCjW4T7detonOKwZI4y',
                      },
                    },
                  ],
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
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'vzwvNtutFW0=',
              parentSpanId: 'R5+h4rUGjAg=',
              name: 'place-articles',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1718122136007859429',
              endTimeUnixNano: '1718122136268919885',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
                  },
                },
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
                    stringValue: '192.168.129.185',
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
                    intValue: '8569',
                  },
                },
                {
                  key: 'http.flavor',
                  value: {
                    stringValue: '1.1',
                  },
                },
                {
                  key: 'http.response.header.content-type',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'application/json',
                        },
                      ],
                    },
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
                    intValue: '751980',
                  },
                },
                {
                  key: 'http.request_content_length',
                  value: {
                    intValue: '34141',
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
                    stringValue: 'https://cart-service.local:8569/place-articles',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '201',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136203406997',
                  name: 'event_k6.MpUSHGnzHW',
                  attributes: [
                    {
                      key: 'k6.l2JhL9LZbdTkz9E',
                      value: {
                        stringValue: 'qVBJorKlU0MA6VRnrd0pW9muK6Ij7k',
                      },
                    },
                    {
                      key: 'k6.pieF4s3vVr6p8ku',
                      value: {
                        stringValue: 'Xnf4V6q33T3wfckKmHbOg0afkEh5Fo',
                      },
                    },
                    {
                      key: 'k6.MNHbHRU5zLSQKWW',
                      value: {
                        stringValue: 'Hby9qlMSDjbiXYLnORqmvPYp7XNhTQ',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136146675140',
                  name: 'event_k6.JnRiJWcamn',
                  attributes: [
                    {
                      key: 'k6.nY9q92HcD0OQj66',
                      value: {
                        stringValue: 'jEN2cPz0ecykpAKAosH9BnQn7eBljV',
                      },
                    },
                    {
                      key: 'k6.cluyyyeK3ZlISD7',
                      value: {
                        stringValue: '7qyFcsRFfcI32uXfWD3mQagTQlszZu',
                      },
                    },
                    {
                      key: 'k6.v8sGq2lPUMgEOXZ',
                      value: {
                        stringValue: '5c1oTqFjjpTHP3vRfILdosK0F1a5EU',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136047138011',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.DyoewbKjvlKhB7p7m1V3',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\nmain.main()',
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.UrRTn11slD',
                      },
                    },
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'k6.5NYGiSBnep9YBIY',
                      value: {
                        stringValue: 'En58EmO8S1a37B2FU6XcHDhb4cFMta',
                      },
                    },
                    {
                      key: 'k6.TGjvbz4lnCS4ZT8',
                      value: {
                        stringValue: 'J6YCDh1j7m7ggQ0NDhY7tmVOmTUCVx',
                      },
                    },
                    {
                      key: 'k6.OvrsPnmMlQklKaW',
                      value: {
                        stringValue: 'Uwh0ePszj6xfZwLs5YV9yhY9JHJ1MH',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'f3J5Ie32ajw=',
              parentSpanId: 'vzwvNtutFW0=',
              name: 'persist-cart',
              kind: 'SPAN_KIND_INTERNAL',
              startTimeUnixNano: '1718122136032445342',
              endTimeUnixNano: '1718122136181070070',
              attributes: [
                {
                  key: 'numbers',
                  value: {
                    arrayValue: {
                      values: [
                        {
                          stringValue: 'one',
                        },
                        {
                          stringValue: 'two',
                        },
                        {
                          stringValue: 'three',
                        },
                      ],
                    },
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136113822486',
                  name: 'event_k6.NBujEjHLhn',
                  attributes: [
                    {
                      key: 'k6.hkAPSBbu5QKTNdQ',
                      value: {
                        stringValue: '1x8f2TJvg7AI4RO4A30hYh4g7OPWii',
                      },
                    },
                    {
                      key: 'k6.aSpTXoAPRHgFSwb',
                      value: {
                        stringValue: 'x4LqX7VrugMRxkWm4EqxfTGyHg6c6a',
                      },
                    },
                    {
                      key: 'k6.YIZb89UktDSSuMv',
                      value: {
                        stringValue: '1ASIDwCeM8J8KNeBab3GqtINvAVhHp',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136107329261',
                  name: 'event_k6.gkrRkvoUaJ',
                  attributes: [
                    {
                      key: 'k6.hROOwpwdeK2SNMC',
                      value: {
                        stringValue: 'hiZ6CqaCuJb0lPZYJQlq4YHJtlc9D2',
                      },
                    },
                    {
                      key: 'k6.Ku4s4qcO6mdBJSI',
                      value: {
                        stringValue: 'kM0lf7uJKsad8Nr6fEnJmN4BlpRsnQ',
                      },
                    },
                    {
                      key: 'k6.1kauecg7ejqdT3x',
                      value: {
                        stringValue: 'JWu9BD49BHPspSmrQZHgP43b1lP4nR',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1718122136113457263',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.nI7SzvvlWcofONBAuHnW',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: "panic: runtime error: can't divide by 0\npayment.collect()",
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.fCLeszQUJO',
                      },
                    },
                    {
                      key: 'k6.XbP7rI1K5WGlFbi',
                      value: {
                        stringValue: '0XBtgNknyGLknDZ9LyOxHJeNUFIG0A',
                      },
                    },
                    {
                      key: 'k6.pXdHJMWGYPDjNAG',
                      value: {
                        stringValue: 'fjcaG7XLw6kWW3TtIna1VwlkwBiCUy',
                      },
                    },
                    {
                      key: 'k6.OAJwJcU2Y5RiDbs',
                      value: {
                        stringValue: 'yRwf8PxKADpRtmMa2zC6hOlvrNNzsu',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
          ],
        },
      ],
    },
  ],
};

export const MOCK_TRACE_RESPONSE_SMALL: QueryResponse = {
  batches: [
    {
      resource: {
        attributes: [
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
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'nCLrd8tcFMc=',
              name: 'article-to-cart',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1718122135898442804',
              endTimeUnixNano: '1718122136696651946',
              attributes: [
                {
                  key: 'http.url',
                  value: {
                    stringValue: 'https://shop-backend.local:8523/article-to-cart',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '202',
                  },
                },
              ],
              status: {},
            },
            {
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'hGe8oRN3wWY=',
              parentSpanId: 'nCLrd8tcFMc=',
              name: 'authenticate',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1718122135954765948',
              endTimeUnixNano: '1718122136154227489',
              attributes: [
                {
                  key: 'net.transport',
                  value: {
                    stringValue: 'ip_tcp',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1718122136068613856',
                  name: 'event_k6.7W272ywYih',
                  attributes: [
                    {
                      key: 'k6.sJekvnAr5h7vJfK',
                      value: {
                        stringValue: 'SZ9vwpLkAzAm2Bju1VJroUlGD8u3pS',
                      },
                    },
                    {
                      key: 'k6.81JLO5NlT1lAeF1',
                      value: {
                        stringValue: '4AzrPTOML11aIN3dYgbKSaAe9HErnZ',
                      },
                    },
                    {
                      key: 'k6.tdj0bfOxLndyJuN',
                      value: {
                        stringValue: 'PeMAsdQ5469IjQgGtifBA7OgfFdoMb',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'r2NxHHPjciM=',
              parentSpanId: 'nCLrd8tcFMc=',
              name: 'get-article',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1718122135965210897',
              endTimeUnixNano: '1718122136520157839',
              attributes: [
                {
                  key: 'http.method',
                  value: {
                    stringValue: 'DELETE',
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
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'AYBIFdTlycc=',
              parentSpanId: 'hGe8oRN3wWY=',
              name: 'authenticate',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1718122135970602296',
              endTimeUnixNano: '1718122136107740742',
              status: {
                message: 'Forbidden',
                code: 'STATUS_CODE_ERROR',
              },
            },
          ],
        },
      ],
    },
  ],
};

export const MOCK_SEARCH_RESPONSE_VPARQUET3: SearchResponse = {
  traces: [
    {
      traceID: 'fbd37845209d43cdccd418dc5f9ff021',
      rootServiceName: 'shop-backend',
      rootTraceName: 'article-to-cart',
      startTimeUnixNano: '1718122135898442804',
      durationMs: 798,
      spanSet: {
        spans: [
          {
            spanID: '9c22eb77cb5c14c7',
            name: 'article-to-cart',
            startTimeUnixNano: '1718122135898442804',
            durationNanos: '798209142',
            attributes: [
              {
                key: 'service.name',
                value: {
                  stringValue: 'shop-backend',
                },
              },
            ],
          },
        ],
        matched: 1,
      },
      spanSets: [
        {
          spans: [
            {
              spanID: '9c22eb77cb5c14c7',
              name: 'article-to-cart',
              startTimeUnixNano: '1718122135898442804',
              durationNanos: '798209142',
              attributes: [
                {
                  key: 'service.name',
                  value: {
                    stringValue: 'shop-backend',
                  },
                },
              ],
            },
          ],
          matched: 1,
        },
      ],
    },
  ],
};

export const MOCK_SEARCH_RESPONSE_VPARQUET4: SearchResponse = {
  traces: [
    {
      traceID: 'fbd37845209d43cdccd418dc5f9ff021',
      rootServiceName: 'shop-backend',
      rootTraceName: 'article-to-cart',
      startTimeUnixNano: '1718122135898442804',
      durationMs: 798,
      spanSet: {
        spans: [
          {
            spanID: '9c22eb77cb5c14c7',
            name: 'article-to-cart',
            startTimeUnixNano: '1718122135898442804',
            durationNanos: '798209142',
            attributes: [
              {
                key: 'service.name',
                value: {
                  stringValue: 'shop-backend',
                },
              },
            ],
          },
        ],
        matched: 1,
      },
      spanSets: [
        {
          spans: [
            {
              spanID: '9c22eb77cb5c14c7',
              name: 'article-to-cart',
              startTimeUnixNano: '1718122135898442804',
              durationNanos: '798209142',
              attributes: [
                {
                  key: 'service.name',
                  value: {
                    stringValue: 'shop-backend',
                  },
                },
              ],
            },
          ],
          matched: 1,
        },
      ],
      serviceStats: {
        'article-service': {
          spanCount: 2,
        },
        'auth-service': {
          spanCount: 1,
        },
        'cart-service': {
          spanCount: 2,
        },
        postgres: {
          spanCount: 1,
        },
        'shop-backend': {
          spanCount: 4,
        },
      },
    },
  ],
};

export const MOCK_SEARCH_RESPONSE_MIXED_VPARQUET3_AND_4: SearchResponse = {
  traces: [
    {
      traceID: '224a0e75a0d244f1a3dab3af233e6cf3',
      rootServiceName: 'telemetrygen',
      rootTraceName: 'lets-go',
      startTimeUnixNano: '1727969811138427469',
      spanSets: [
        {
          spans: [
            {
              spanID: '237f68dfbed2f473',
              startTimeUnixNano: '1727969811138427469',
              durationNanos: '123000',
            },
            {
              spanID: 'a8eefdaad116a872',
              startTimeUnixNano: '1727969811138427469',
              durationNanos: '123000',
            },
          ],
          matched: 2,
        },
      ],
      serviceStats: {
        telemetrygen: {
          spanCount: 2,
        },
      },
    },
    {
      traceID: '71bd40553a881d98dc52f2a27fd53fe3',
      rootServiceName: 'telemetrygen',
      rootTraceName: 'lets-go',
      startTimeUnixNano: '1727969665041183110',
      spanSets: [
        {
          spans: [
            {
              spanID: '968a78f0ffbc6570',
              startTimeUnixNano: '1727969665041183110',
              durationNanos: '123000',
            },
            {
              spanID: 'bb8ab44ffd46ca07',
              startTimeUnixNano: '1727969665041183110',
              durationNanos: '123000',
            },
          ],
          matched: 2,
        },
      ],
    },
  ],
};

export const MOCK_TRACE_DATA_SEARCHRESULT: TraceData = {
  searchResult: [
    {
      startTimeUnixMs: 1718122135898.4426,
      durationMs: 798,
      serviceStats: {
        'shop-backend': {
          spanCount: 4,
        },
        'cart-service': {
          spanCount: 2,
        },
        'article-service': {
          spanCount: 2,
        },
        'auth-service': {
          spanCount: 1,
        },
        postgres: {
          spanCount: 1,
        },
      },
      traceId: 'fbd37845209d43cdccd418dc5f9ff021',
      rootServiceName: 'shop-backend',
      rootTraceName: 'article-to-cart',
    },
  ],
  metadata: { executedQueryString: 'duration > 900ms' },
};

export const MOCK_TRACE_DATA_TRACE: TraceData = {
  trace: {
    rootSpan: {
      resource: {
        serviceName: 'shop-backend',
        attributes: [{ key: 'service.name', value: { stringValue: 'shop-backend' } }],
      },
      scope: { name: 'k6' },
      traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
      spanId: 'nCLrd8tcFMc=',
      name: 'article-to-cart',
      kind: 'SPAN_KIND_SERVER',
      startTimeUnixMs: 1718122135898.4426,
      endTimeUnixMs: 1718122136696.6519,
      attributes: [
        { key: 'http.url', value: { stringValue: 'https://shop-backend.local:8523/article-to-cart' } },
        { key: 'http.status_code', value: { intValue: '202' } },
      ],
      events: [],
      status: {},
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
                serviceName: 'auth-service',
                attributes: [{ key: 'service.name', value: { stringValue: 'auth-service' } }],
              },
              scope: { name: 'k6' },
              childSpans: [],
              traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
              spanId: 'AYBIFdTlycc=',
              parentSpanId: 'hGe8oRN3wWY=',
              name: 'authenticate',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixMs: 1718122135970.602,
              endTimeUnixMs: 1718122136107.7405,
              attributes: [],
              events: [],
              status: { message: 'Forbidden', code: 'STATUS_CODE_ERROR' },
            },
          ],
          traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
          spanId: 'hGe8oRN3wWY=',
          parentSpanId: 'nCLrd8tcFMc=',
          name: 'authenticate',
          kind: 'SPAN_KIND_CLIENT',
          startTimeUnixMs: 1718122135954.7656,
          endTimeUnixMs: 1718122136154.2273,
          attributes: [{ key: 'net.transport', value: { stringValue: 'ip_tcp' } }],
          events: [
            {
              timeUnixMs: 1718122136068.6138,
              name: 'event_k6.7W272ywYih',
              attributes: [
                { key: 'k6.sJekvnAr5h7vJfK', value: { stringValue: 'SZ9vwpLkAzAm2Bju1VJroUlGD8u3pS' } },
                { key: 'k6.81JLO5NlT1lAeF1', value: { stringValue: '4AzrPTOML11aIN3dYgbKSaAe9HErnZ' } },
                { key: 'k6.tdj0bfOxLndyJuN', value: { stringValue: 'PeMAsdQ5469IjQgGtifBA7OgfFdoMb' } },
              ],
            },
          ],
          status: {},
        },
        {
          resource: {
            serviceName: 'shop-backend',
            attributes: [{ key: 'service.name', value: { stringValue: 'shop-backend' } }],
          },
          scope: { name: 'k6' },
          childSpans: [],
          traceId: '+9N4RSCdQ83M1BjcX5/wIQ==',
          spanId: 'r2NxHHPjciM=',
          parentSpanId: 'nCLrd8tcFMc=',
          name: 'get-article',
          kind: 'SPAN_KIND_CLIENT',
          startTimeUnixMs: 1718122135965.2107,
          endTimeUnixMs: 1718122136520.158,
          attributes: [{ key: 'http.method', value: { stringValue: 'DELETE' } }],
          events: [],
          status: {},
        },
      ],
    },
  },
  metadata: { executedQueryString: '61a1487c461d9e08' },
};
addParentReferences(MOCK_TRACE_DATA_TRACE.trace!.rootSpan);
