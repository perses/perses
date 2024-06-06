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

// TODO: use definitions from tempo-plugin/src/model
export interface TraceResponse {
  batches: Batch[];
}

export interface Batch {
  resource: Resource;
  scopeSpans: ScopeSpan[];
}

export interface Resource {
  attributes: Attribute[];
}

export interface Attribute {
  key: string;
  value: Value;
}

export interface Value {
  stringValue?: string;
}

export interface ScopeSpan {
  spans: Span[];
}

export interface Span {
  parentSpanId?: string;
  spanId: string;
  name: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
}

export const traceResponse = {
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
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: 'rp3Bmf5Z4wk=',
              name: 'article-to-cart',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1717777733437732352',
              endTimeUnixNano: '1717777734017966805',
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
                    stringValue: '192.168.207.162',
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
                    intValue: '8319',
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
                    intValue: '189690',
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
                    stringValue: 'https://shop-backend.local:8319/article-to-cart',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '204',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1717777733489418215',
                  name: 'event_k6.1b3uVAjRQa',
                  attributes: [
                    {
                      key: 'k6.TLcVaqZGd63gWqE',
                      value: {
                        stringValue: 'j44zoZLtdqes9HaXJZFl8EEtfjWS6Z',
                      },
                    },
                    {
                      key: 'k6.oVXenjEgAtFHycW',
                      value: {
                        stringValue: '9EOQUF1AGmNINZ1mnkKr5GbMG2LTtO',
                      },
                    },
                    {
                      key: 'k6.x053XPlC53oPteL',
                      value: {
                        stringValue: 'sPwhHhUOPLEMuiRX9jkU3WHsT0yJXJ',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733881237796',
                  name: 'event_k6.tednSCepjg',
                  attributes: [
                    {
                      key: 'k6.CRLe0OWuix0auc2',
                      value: {
                        stringValue: 'YowmmYYenTnuplrtmfodl9DlhrODnb',
                      },
                    },
                    {
                      key: 'k6.Zvmp4pKQ01T7SFN',
                      value: {
                        stringValue: 'vcfKEd6uCtHP1gR4tg6Fq37gTLd3wN',
                      },
                    },
                    {
                      key: 'k6.hqEsUtowHgNVig4',
                      value: {
                        stringValue: 'ttvdGU0cAhgKx1Z71P4bPIxdLI2lKB',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733707427259',
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
                        stringValue: 'error: k6.AtNoYGtZNrLqaSVibeBG',
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
                        stringValue: 'error.type_k6.5TM8RAykAE',
                      },
                    },
                    {
                      key: 'k6.biBzdtBpmGK6yDt',
                      value: {
                        stringValue: '8sm1fHG4EgWhFZzjnWp0KnRD24fu4E',
                      },
                    },
                    {
                      key: 'k6.oSOaekHlE0I3sKK',
                      value: {
                        stringValue: 'pTYWLIL00jb019PoumligGE9Uspljd',
                      },
                    },
                    {
                      key: 'k6.XR3U0JEhXppwpkt',
                      value: {
                        stringValue: 'xTzKGOxHJYoHuNl51sVNpSvghhnpEs',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: 'fCIx3ppMFoo=',
              parentSpanId: 'rp3Bmf5Z4wk=',
              name: 'authenticate',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1717777733484178108',
              endTimeUnixNano: '1717777733609770876',
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
                    intValue: '8013',
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
                    stringValue: '192.168.52.128',
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
                          stringValue: 'application/json',
                        },
                      ],
                    },
                  },
                },
                {
                  key: 'http.response_content_length',
                  value: {
                    intValue: '695425',
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
                    stringValue: 'https://auth-service.local:8064/authenticate',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '204',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1717777733595488824',
                  name: 'event_k6.yUqcEgvPLO',
                  attributes: [
                    {
                      key: 'k6.HZq6HvB86QIWQXo',
                      value: {
                        stringValue: 'RWaQlNDuCkOzYWC50ZxQ1bEGHj8gOk',
                      },
                    },
                    {
                      key: 'k6.YCSY7C2y5ewHe6f',
                      value: {
                        stringValue: 'F6ks7JbqhjVXy4MlWAjCKOnHOTwI4G',
                      },
                    },
                    {
                      key: 'k6.Smd2I6lKJGsUi3j',
                      value: {
                        stringValue: 'LnoN2CDpVTFeMn5drI651SAaslF7j6',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733529721897',
                  name: 'event_k6.rnkasUMUZB',
                  attributes: [
                    {
                      key: 'k6.yBcj2IuDpUYAz2b',
                      value: {
                        stringValue: '7wczYPCwHVjM1C13qQaOMvcvwzmkgm',
                      },
                    },
                    {
                      key: 'k6.kNsaN6SLs2hPT6t',
                      value: {
                        stringValue: 'fIyB2bQRRX7yr2jvbB3rp4Torri6n9',
                      },
                    },
                    {
                      key: 'k6.N46ec48b9WuZLgH',
                      value: {
                        stringValue: 'gZJ5fc6jhshhGCJ6Ln8Q7BlA9TIxrn',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733492939425',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.GMkeTfgY8w',
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
                        stringValue: 'error: k6.U5U8zu1NeYM5DDAKl6op',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\nmain.main()',
                      },
                    },
                    {
                      key: 'k6.fQZnDFawO9MQEFL',
                      value: {
                        stringValue: 'oXbeq0j1E2KAlPpWjKMMGVWnop7utY',
                      },
                    },
                    {
                      key: 'k6.U2YlKg5LvVbzPS5',
                      value: {
                        stringValue: 'HcyTnDu11L4b0juIwCmqzuGuiMDqOK',
                      },
                    },
                    {
                      key: 'k6.85gYcRShj2alelA',
                      value: {
                        stringValue: 'B1jqqxLdHiap2jDLfn8VATy3dbKA3o',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: 'OmQn31twjEI=',
              parentSpanId: 'rp3Bmf5Z4wk=',
              name: 'get-article',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1717777733481702160',
              endTimeUnixNano: '1717777733940026697',
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
                    intValue: '8263',
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
                    stringValue: '192.168.207.211',
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
                          stringValue: 'text/html',
                        },
                      ],
                    },
                  },
                },
                {
                  key: 'http.response_content_length',
                  value: {
                    intValue: '923205',
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
                    stringValue: 'https://article-service.local:8630/get-article',
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
                  timeUnixNano: '1717777733487790420',
                  name: 'event_k6.n7lvUkjoXi',
                  attributes: [
                    {
                      key: 'k6.4KsJ6sNVwEmMAsF',
                      value: {
                        stringValue: '1ZT8ZPyr6y0eaCqaGtTFOlLfUeDiqK',
                      },
                    },
                    {
                      key: 'k6.Ieqt8RAiDD0Y8Ko',
                      value: {
                        stringValue: 'pQfioSHxmHhIbqBEx2qVYgUaVK92GV',
                      },
                    },
                    {
                      key: 'k6.RUsNpo1fiSwapcB',
                      value: {
                        stringValue: 'WTCkxmbg6G1h0tdEXhrkfCNABt3hqp',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733563360566',
                  name: 'event_k6.XNEgfyAICq',
                  attributes: [
                    {
                      key: 'k6.uxHgM7ePL9Pu4kw',
                      value: {
                        stringValue: 'WroUoquZ3XTiJCHNgcitmebr8zwOAN',
                      },
                    },
                    {
                      key: 'k6.YdEDymLiiZX5EWu',
                      value: {
                        stringValue: 'IjJ8nd9KGWDTqCcluJ8OBKj7BJldRu',
                      },
                    },
                    {
                      key: 'k6.icMsUG7xXocpu3P',
                      value: {
                        stringValue: 'Nbx098GWr2ueW04RgDO33pSuaWyzpu',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733614721279',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.ldJtwJy5slVrxndIYKtk',
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
                        stringValue: 'error.type_k6.TKPszVi41u',
                      },
                    },
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'k6.JPwV2E3bb3tfcht',
                      value: {
                        stringValue: 'pf3bXI1VGrRnac50JVMulBrWPzmhH0',
                      },
                    },
                    {
                      key: 'k6.LlPo4l8LQ0QGaLc',
                      value: {
                        stringValue: 'qaX5S0WR1UGLa45xYI75RQaI0qkS7S',
                      },
                    },
                    {
                      key: 'k6.5zxrC9cqEt3aewH',
                      value: {
                        stringValue: 'Pf5291kurZR4Dri4eJ1lNHZ1SnZqVv',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: 'pvV3VRQn+oA=',
              parentSpanId: 'rp3Bmf5Z4wk=',
              name: 'place-articles',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1717777733477523416',
              endTimeUnixNano: '1717777733813367389',
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
                    intValue: '8613',
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
                    stringValue: '192.168.181.244',
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
                          stringValue: 'application/xml',
                        },
                      ],
                    },
                  },
                },
                {
                  key: 'http.response_content_length',
                  value: {
                    intValue: '481995',
                  },
                },
                {
                  key: 'http.method',
                  value: {
                    stringValue: 'POST',
                  },
                },
                {
                  key: 'http.url',
                  value: {
                    stringValue: 'https://cart-service.local:8127/place-articles',
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
                  timeUnixNano: '1717777733752066290',
                  name: 'event_k6.k6PpVnKxoT',
                  attributes: [
                    {
                      key: 'k6.NxMKnP4MrDgBHZw',
                      value: {
                        stringValue: 'Qzs38cKmzesxvhwFSt7d0VjZBDN0XD',
                      },
                    },
                    {
                      key: 'k6.fAp6e3Md7LPtlED',
                      value: {
                        stringValue: 'xRUINxynAt62U8zTQReL2AkoYWR21s',
                      },
                    },
                    {
                      key: 'k6.7IIFTgUbt9uv2Bd',
                      value: {
                        stringValue: 'rMPaXsiy3Ec9et3LPn4epl1nti9EMr',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733773459980',
                  name: 'event_k6.7cGlUBVRsJ',
                  attributes: [
                    {
                      key: 'k6.c45ViluCP0Po8bp',
                      value: {
                        stringValue: 'YJ6hlY4oGmT9YJrYBuJT4l3XZbibq9',
                      },
                    },
                    {
                      key: 'k6.jZrGuN5XSn7CM4R',
                      value: {
                        stringValue: 'c62NZIHCGE9NroVnxnk272X4M5dyCB',
                      },
                    },
                    {
                      key: 'k6.QzroJcTCzHkODho',
                      value: {
                        stringValue: 'se1A0dGJvDgc3XV6mb8AE4RMYPWkx3',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733799606907',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.P7sk5iE3gyl0DJuyX1yH',
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
                        stringValue: 'error.type_k6.WYW9nr6WWe',
                      },
                    },
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'k6.9sWOQyi271Pr4Zy',
                      value: {
                        stringValue: 'oWryTSRMnrPbT0VGHppqa5dXvV5OHb',
                      },
                    },
                    {
                      key: 'k6.iNTI4B0SPwudRGp',
                      value: {
                        stringValue: 'pgZpGJNfbJ2eyMOWj1KKFKYyVB2L7u',
                      },
                    },
                    {
                      key: 'k6.jpaN7ebFN7QTihN',
                      value: {
                        stringValue: 'bcceEyl7sR2cU42ekbuZjtnlW4aJ8g',
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
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: '3rrNdMHOa9o=',
              parentSpanId: 'fCIx3ppMFoo=',
              name: 'authenticate',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1717777733490528861',
              endTimeUnixNano: '1717777733596166150',
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
                    stringValue: '192.168.52.128',
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
                    intValue: '8064',
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
                    stringValue: '/authenticate',
                  },
                },
                {
                  key: 'http.response_content_length',
                  value: {
                    intValue: '695425',
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
                    stringValue: 'https://auth-service.local:8064/authenticate',
                  },
                },
                {
                  key: 'http.status_code',
                  value: {
                    intValue: '204',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1717777733567848962',
                  name: 'event_k6.tmWbfEMhim',
                  attributes: [
                    {
                      key: 'k6.7Ym3AEOVOY7HLtG',
                      value: {
                        stringValue: 'lQcxNZeAo79TQPrlEc1W4VlLJwDjrh',
                      },
                    },
                    {
                      key: 'k6.WeR6FWihOPcLQkG',
                      value: {
                        stringValue: 'tkBCV2ACgBd2ZUHMz21n0DWBqXALXo',
                      },
                    },
                    {
                      key: 'k6.OSJP6xVl5DNwxuj',
                      value: {
                        stringValue: '9caItIpVbfRrTLt6zr00azOo3VGeJx',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733496637224',
                  name: 'event_k6.cykl6KseVc',
                  attributes: [
                    {
                      key: 'k6.Rm9NThm9j6zAZwe',
                      value: {
                        stringValue: 'ymh6j1i7lUGYDAbSbugqu4hxD1Jx7B',
                      },
                    },
                    {
                      key: 'k6.bWqEo9HBbN2S6RX',
                      value: {
                        stringValue: 'YKmMRKyYL37rU0JNGrUexzYfzGB3dh',
                      },
                    },
                    {
                      key: 'k6.KkCiMOvJPggJe3Z',
                      value: {
                        stringValue: 'APh8PciMCKQXjqzR8jF7w2syIQGSJj',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733574757115',
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
                        stringValue: 'error: k6.tjskRgifitIDJJLhlwI0',
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
                        stringValue: 'error.type_k6.Wsin5B8oBc',
                      },
                    },
                    {
                      key: 'k6.Xt3IMuXv6mTNSn6',
                      value: {
                        stringValue: 'VLBRcKRBNEwLdQPOLoGghjFIkI1OED',
                      },
                    },
                    {
                      key: 'k6.gu04nKTMn1IaK8l',
                      value: {
                        stringValue: 'GaGj62Tot5wll8ZGwCBvW9Qh84czDK',
                      },
                    },
                    {
                      key: 'k6.aoRSFRk9udk2HRL',
                      value: {
                        stringValue: 'pOtoLMoYPwDHgsNk7u2UAC1vLovC3c',
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
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: 'Cc3Gz5Fl4Qw=',
              parentSpanId: 'OmQn31twjEI=',
              name: 'get-article',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1717777733506232723',
              endTimeUnixNano: '1717777733834138048',
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
                    stringValue: '192.168.207.211',
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
                    intValue: '8630',
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
                    stringValue: '/get-article',
                  },
                },
                {
                  key: 'http.response_content_length',
                  value: {
                    intValue: '923205',
                  },
                },
                {
                  key: 'http.request_content_length',
                  value: {
                    intValue: '81482',
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
                    stringValue: 'https://article-service.local:8630/get-article',
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
                  timeUnixNano: '1717777733732122523',
                  name: 'event_k6.lH20D8zcMC',
                  attributes: [
                    {
                      key: 'k6.dWqEIavqu6ivU2z',
                      value: {
                        stringValue: 'S59oN6LJ2z50D4zyjawsbcWmxILrjn',
                      },
                    },
                    {
                      key: 'k6.ZizP7qyWSdNF4q0',
                      value: {
                        stringValue: 'Mwp5b1OaGBOz468srlBkS9XKgkMys3',
                      },
                    },
                    {
                      key: 'k6.ef6WdL5uXWFtXLo',
                      value: {
                        stringValue: 'OgdYyXZIgqbNiOPXcvptWdWuTz5Xzt',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733694583949',
                  name: 'event_k6.HGvQ5PFzNg',
                  attributes: [
                    {
                      key: 'k6.CyN5kzbitF59ldE',
                      value: {
                        stringValue: 'afam6JbDN6BIgXUZVXOQ6AMpdpv2OC',
                      },
                    },
                    {
                      key: 'k6.hn7OAlZkm0XlPqR',
                      value: {
                        stringValue: 'jGrceebZym6uODtpDKJf5IzT7XG80I',
                      },
                    },
                    {
                      key: 'k6.Qw3Pys3uMmvHs3U',
                      value: {
                        stringValue: 'kXfUzBJr6Jlcc91XuWt875R0C1Bi78',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733638061736',
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
                        stringValue: 'error: k6.jKOU07mLSqLogzLCLjKk',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\naccount.login()',
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.216hGiqKUZ',
                      },
                    },
                    {
                      key: 'k6.d06GF2vdsSqb4ay',
                      value: {
                        stringValue: 'Toe8Nmj9VbtnoS6RyU4onfOEiFPZ7z',
                      },
                    },
                    {
                      key: 'k6.5sEa0qOo4yfcbZ2',
                      value: {
                        stringValue: 'ZSLEgz9YWjES4fyLpwmdCf2kR4U9pU',
                      },
                    },
                    {
                      key: 'k6.puNE7XWk0Fm67Hd',
                      value: {
                        stringValue: 'F5hi5v6M8qUEwq4TLnRhozPMOVe1CK',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: 'V0BXCuVqcvE=',
              parentSpanId: 'Cc3Gz5Fl4Qw=',
              name: 'select-articles',
              kind: 'SPAN_KIND_CLIENT',
              startTimeUnixNano: '1717777733535028103',
              endTimeUnixNano: '1717777733769533803',
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
                    intValue: '8569',
                  },
                },
                {
                  key: 'net.sock.peer.addr',
                  value: {
                    stringValue: '192.168.81.36',
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
                  timeUnixNano: '1717777733636790701',
                  name: 'event_k6.s3od9cdyFK',
                  attributes: [
                    {
                      key: 'k6.bEe3WV18FfA4bNy',
                      value: {
                        stringValue: 'qXrumMdQTtOLZJCJ1WiG7017PhTlLO',
                      },
                    },
                    {
                      key: 'k6.DQJuMhPevLaMH2H',
                      value: {
                        stringValue: 'GveLWFtoZjGZNgt6YSZp2og4aWrg3q',
                      },
                    },
                    {
                      key: 'k6.BN1kk4j2iEP54Dm',
                      value: {
                        stringValue: 'z7ecE9vMm7lC0oKz9YuGOf26NwR6IJ',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733677094257',
                  name: 'event_k6.z3pRtxPiqa',
                  attributes: [
                    {
                      key: 'k6.rjaFsmJ0O9Uu5Ua',
                      value: {
                        stringValue: 'PijYPoTtI5u7LfIHO6oSfAku6NO4tO',
                      },
                    },
                    {
                      key: 'k6.wpdX1EOrSc70GBy',
                      value: {
                        stringValue: 'rFdTuuYmFaXd4Zbw3NhynrIDQJzvHM',
                      },
                    },
                    {
                      key: 'k6.aA4BLML9bFs5wY0',
                      value: {
                        stringValue: '5Y356cy746N5pZHZfwRirqXHMvi2e0',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733538252152',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: "panic: runtime error: can't divide by 0\npayment.collect()",
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.2yk2n33txt',
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
                        stringValue: 'error: k6.d0kuXeDyUvocVrC3Mmu3',
                      },
                    },
                    {
                      key: 'k6.nRNDnzUcO8CkqmY',
                      value: {
                        stringValue: '6LHVeEFgKAn3qBYOp8awcTBF9QtSjd',
                      },
                    },
                    {
                      key: 'k6.0EkkMQDPetmcnKd',
                      value: {
                        stringValue: 'dqqb1dJ0DZbAHAAGo9hsNRS32ZHvwx',
                      },
                    },
                    {
                      key: 'k6.xCHzw0t4BZ2sryK',
                      value: {
                        stringValue: 'jMECJ8h4pdR0ImCvPfMbphi8xwC6sN',
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
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: '9kh6zMp6tR8=',
              parentSpanId: 'V0BXCuVqcvE=',
              name: 'query-articles',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1717777733557505434',
              endTimeUnixNano: '1717777733691549745',
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
                  key: 'k6.1jqG5N5heb8xmsf',
                  value: {
                    stringValue: 'LDsSSsEGiTAy5Hc6HtJdDyfYcVuXKU',
                  },
                },
                {
                  key: 'k6.rXZvV6TTDgT6zSo',
                  value: {
                    stringValue: '6rvYHBVz4TEDRtz3A20fmZcYr8hKta',
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
                    stringValue: '192.168.81.36',
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
                    intValue: '8777',
                  },
                },
              ],
              events: [
                {
                  timeUnixNano: '1717777733637636435',
                  name: 'event_k6.AJTPQlzEGK',
                  attributes: [
                    {
                      key: 'k6.5Cps5gQyeL54nwy',
                      value: {
                        stringValue: '6yW9EdzI0mvqfY0XEuJFuDl03bBZ1F',
                      },
                    },
                    {
                      key: 'k6.r9PUWIWiOu9Y5OT',
                      value: {
                        stringValue: 'q4USIDerpT3fLhkweTLNRKEy6H5qhd',
                      },
                    },
                    {
                      key: 'k6.ODwYz2ogRtDROcO',
                      value: {
                        stringValue: 'X57IfEZnUFXJWkUJYpGRa6Ld6Ik9gr',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733647493107',
                  name: 'event_k6.RUo7DpXWFQ',
                  attributes: [
                    {
                      key: 'k6.ze5RGo1TUFxZdH5',
                      value: {
                        stringValue: 'ZqNXggRqkAMR1oIdVo95wvSLZZOsz5',
                      },
                    },
                    {
                      key: 'k6.J9HRZc3Q13zjEch',
                      value: {
                        stringValue: 'ysb278CS5i0wzM1We3EPhLkceyCi7T',
                      },
                    },
                    {
                      key: 'k6.iznVPUJYzPTVNwc',
                      value: {
                        stringValue: 'UXqa9dkxUXYFtQ4kKjcV6gGVfRuL8v',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733565792805',
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
                        stringValue: 'error: k6.DWAiqyXWwDTSnsoZKLcG',
                      },
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: "panic: runtime error: can't divide by 0\naccount.login()",
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.uvbijuEq0Y',
                      },
                    },
                    {
                      key: 'k6.GUzGQLofEYVTUBv',
                      value: {
                        stringValue: 'dGHNsDL8dRQ1rKJwhq26phgcOmHFgD',
                      },
                    },
                    {
                      key: 'k6.jiN5g64B8CnmC5h',
                      value: {
                        stringValue: 'rzKa14za0q0pN9Up1MWlAEMsXdhUCI',
                      },
                    },
                    {
                      key: 'k6.r78ZsfFCmHZ6nV9',
                      value: {
                        stringValue: 'hZsGyRLeqiofZEdHBrgSsN0udkjD1D',
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
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: 'YsynqnDhQ8c=',
              parentSpanId: 'pvV3VRQn+oA=',
              name: 'place-articles',
              kind: 'SPAN_KIND_SERVER',
              startTimeUnixNano: '1717777733494634546',
              endTimeUnixNano: '1717777733741244044',
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
                    stringValue: '192.168.181.244',
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
                    intValue: '8127',
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
                          stringValue: 'application/xml',
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
                    intValue: '481995',
                  },
                },
                {
                  key: 'http.request_content_length',
                  value: {
                    intValue: '81869',
                  },
                },
                {
                  key: 'http.method',
                  value: {
                    stringValue: 'POST',
                  },
                },
                {
                  key: 'http.url',
                  value: {
                    stringValue: 'https://cart-service.local:8127/place-articles',
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
                  timeUnixNano: '1717777733655425384',
                  name: 'event_k6.ztHm9w0Hhq',
                  attributes: [
                    {
                      key: 'k6.19PfvfFVM6JvSIe',
                      value: {
                        stringValue: 'N5xZR5JQ4QtMoblxEqMf9hDbNzuFBX',
                      },
                    },
                    {
                      key: 'k6.jRtOOp008Xv4LXa',
                      value: {
                        stringValue: '7lidTUqUKB3SFkPQvZIb7HXqh3Jddz',
                      },
                    },
                    {
                      key: 'k6.P9jDo6AlBSB3mhp',
                      value: {
                        stringValue: 'zQ6gyg4DtAJxIMKgtRv9vih7QcA8vB',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733576718645',
                  name: 'event_k6.VlZ6qCT9Z1',
                  attributes: [
                    {
                      key: 'k6.yfuqRylFtqZBWLX',
                      value: {
                        stringValue: 'jPAsiJWvck2BgyCvmV4hSwv9QUgaih',
                      },
                    },
                    {
                      key: 'k6.B57JjrheoG6xr92',
                      value: {
                        stringValue: 'mqu5idrIMC5oqoYKj4qn64FbGspPFT',
                      },
                    },
                    {
                      key: 'k6.93YYUPkSkerVG3J',
                      value: {
                        stringValue: '2jrgh9GtIsmSz22CmWR4zcNnOaDC7k',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733669049728',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: 'panic: runtime error: index out of range\npayment.collect()',
                      },
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: 'error.type_k6.scYPyUFkIM',
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
                        stringValue: 'error: k6.RDi7DclRio5dfMsen1OT',
                      },
                    },
                    {
                      key: 'k6.IDCHiGSFSBo94hk',
                      value: {
                        stringValue: 'daL1OS6W94rlzLQjXEPzW9QiuSBRij',
                      },
                    },
                    {
                      key: 'k6.hzEVjWg9o8JW6sZ',
                      value: {
                        stringValue: 'JHJb9YSFmkTFqeAqkGLdgsab1quDZ1',
                      },
                    },
                    {
                      key: 'k6.4hi7N4pvQpHrIxh',
                      value: {
                        stringValue: 'iSrh0odJiigVu8hQ1jxt6ktRzf4CNv',
                      },
                    },
                  ],
                },
              ],
              status: {},
            },
            {
              traceId: 'TfeVba+dzQlA+vIjKkCplQ==',
              spanId: 'gqB2LVcpKTw=',
              parentSpanId: 'YsynqnDhQ8c=',
              name: 'persist-cart',
              kind: 'SPAN_KIND_INTERNAL',
              startTimeUnixNano: '1717777733510403329',
              endTimeUnixNano: '1717777733673578490',
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
                  timeUnixNano: '1717777733665316896',
                  name: 'event_k6.ijEeSmfmmQ',
                  attributes: [
                    {
                      key: 'k6.wHwu53ZEjTp1S6k',
                      value: {
                        stringValue: 'fvtNvBivU3m9wdJjOm3Wphqq4ckOw7',
                      },
                    },
                    {
                      key: 'k6.8A253U3Zs9WisjV',
                      value: {
                        stringValue: 'Mux3KsqBhPYIWcMa8bMFBs3d4KxduO',
                      },
                    },
                    {
                      key: 'k6.VJ4ob1t4dWG3v9A',
                      value: {
                        stringValue: 'rw1rzouMQ7gFwvz72LzV9kP0808zcv',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733619584603',
                  name: 'event_k6.FRi17ZXBtC',
                  attributes: [
                    {
                      key: 'k6.o72KfHA1sHUYA3T',
                      value: {
                        stringValue: 'BpoBCeqEcRxSh06WXoSyFIyPzdQHLc',
                      },
                    },
                    {
                      key: 'k6.F555Va3ANbwjcIR',
                      value: {
                        stringValue: 'OMCkVO207yl3k7t0i2N9CE44a4BTJ1',
                      },
                    },
                    {
                      key: 'k6.z4fMo5RLbzie5t0',
                      value: {
                        stringValue: 'ts8LpepcSQ2UfYYXLrY9Z8QETry7Uy',
                      },
                    },
                  ],
                },
                {
                  timeUnixNano: '1717777733625469693',
                  name: 'exception',
                  attributes: [
                    {
                      key: 'exception.message',
                      value: {
                        stringValue: 'error: k6.siqsCvpI52o56RImb7eY',
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
                        stringValue: 'error.type_k6.Ozz0owhn5j',
                      },
                    },
                    {
                      key: 'exception.escape',
                      value: {
                        boolValue: false,
                      },
                    },
                    {
                      key: 'k6.yrYnygZEYfAADQk',
                      value: {
                        stringValue: 'yCTVG0MatdCAHCjZ6oOHiVFEac3t16',
                      },
                    },
                    {
                      key: 'k6.Ib3cI3hqLshgYXH',
                      value: {
                        stringValue: 'yDIhqnfAoMuF0yGv9fZ1OJBivtldMS',
                      },
                    },
                    {
                      key: 'k6.vXbFZCH0vXQqWDR',
                      value: {
                        stringValue: 'IXy1yGrp2vxIkUGDUSbxvSrnquNTe4',
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
