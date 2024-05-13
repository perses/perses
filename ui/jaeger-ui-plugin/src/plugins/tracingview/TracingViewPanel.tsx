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

import { PanelProps } from '@perses-dev/plugin-system';
import { TracingViewOptions } from './tracing-view-model';
import TraceTimelineViewer from '../../components/TracePage/TraceTimelineViewer';
import { ETraceViewType, IViewRange, TUpdateViewRangeTimeFunction, ViewRangeTimeUpdate } from '../../components/TracePage/types';
import ScrollManager from '../../components/TracePage/ScrollManager';
import { scrollBy, scrollTo } from '../../components/TracePage/scroll-page';
import { store } from '../../utils/configure-store';
import { Provider } from 'react-redux'
import TracePageHeader from '../../components/TracePage/TracePageHeader';
import { Box } from '@mui/material';

import 'u-basscss/css/flexbox.css';
import 'u-basscss/css/layout.css';
import 'u-basscss/css/margin.css';
import 'u-basscss/css/padding.css';
import 'u-basscss/css/position.css';
import 'u-basscss/css/typography.css';
import memoizedTraceCriticalPath from '../../components/TracePage/CriticalPath';

export type ScatterChartPanelProps = PanelProps<TracingViewOptions>;

export function TracingViewPanel(props: ScatterChartPanelProps) {
  const { contentDimensions } = props;

  if (contentDimensions === undefined) return null;

  let spanFindMatches: Set<string> | null | undefined;
  //const trace = transformTraceData(traceGenerator.trace({}))!;
  const trace:any = {
    "services": [
      {
        "name": "serviceD",
        "numberOfSpans": 1
      },
      {
        "name": "serviceA",
        "numberOfSpans": 2
      },
      {
        "name": "serviceC",
        "numberOfSpans": 1
      }
    ],
    "spans": [
      {
        "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
        "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
        "spanID": "5ca2149e-8576-5fb6-9481-0f8d9a338fd4",
        "flags": 0,
        "operationName": "MongoDB::update",
        "references": [],
        "startTime": 1715862980287000,
        "duration": 1787120,
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/0107da1a-3d04-5df0-b8fd-9486e5f6d829"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/9959df27-3f41-55a8-9016-c550ddca5dba"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/fc7d7318-7b91-508c-a798-ff6f7550882a"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/5d701328-a5f3-5106-8be5-3d2e3fd0144e"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/f091cd13-ee1e-5b06-8161-91f849067006"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/5a4db4bb-9f46-5921-8338-5d5190d9756f"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/1c2e63b2-3e6d-52a3-9016-410761304c7a"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/a2ea1f64-e799-5ca2-96b2-0c83291eaea5"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/d5ab8ff8-15c6-5144-b922-bfcd3afd66d3"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/7915d553-89d5-5c4d-a00e-fe1d0918a660"
          }
        ],
        "logs": [],
        "process": {
          "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
          "serviceName": "serviceD",
          "tags": [
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/beta/6fbc378a-eb0e-5840-a9c4-e7fad2215310"
            },
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/alpha/2b740ed5-7927-5bf2-aa9b-b7803ecb321e"
            },
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/beta/025ad556-8742-5f84-87ca-0fbc257ad72c"
            }
          ]
        },
        "relativeStartTime": 0,
        "depth": 0,
        "hasChildren": true,
        "childSpanIds": [
          "ccadec49-86a1-5c5e-8f46-41cdeb58d769",
          "11c5d94b-e1f4-5b79-89a9-690b480ebc9b",
          "aed19320-5b14-5b0a-91a2-d04620341fad"
        ],
        "warnings": []
      },
      {
        "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
        "processID": "eaf129a7-443b-5c99-9d56-c933bd2e52e0",
        "spanID": "aed19320-5b14-5b0a-91a2-d04620341fad",
        "flags": 0,
        "operationName": "GET",
        "references": [
          {
            "refType": "CHILD_OF",
            "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
            "spanID": "5ca2149e-8576-5fb6-9481-0f8d9a338fd4",
            "span": {
              "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
              "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
              "spanID": "5ca2149e-8576-5fb6-9481-0f8d9a338fd4",
              "flags": 0,
              "operationName": "MongoDB::update",
              "references": [],
              "startTime": 1715862980287000,
              "duration": 1787120,
              "tags": [
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/0107da1a-3d04-5df0-b8fd-9486e5f6d829"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/9959df27-3f41-55a8-9016-c550ddca5dba"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/fc7d7318-7b91-508c-a798-ff6f7550882a"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/5d701328-a5f3-5106-8be5-3d2e3fd0144e"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/f091cd13-ee1e-5b06-8161-91f849067006"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/alpha/5a4db4bb-9f46-5921-8338-5d5190d9756f"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/1c2e63b2-3e6d-52a3-9016-410761304c7a"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/alpha/a2ea1f64-e799-5ca2-96b2-0c83291eaea5"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/d5ab8ff8-15c6-5144-b922-bfcd3afd66d3"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/7915d553-89d5-5c4d-a00e-fe1d0918a660"
                }
              ],
              "logs": [],
              "process": {
                "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
                "serviceName": "serviceD",
                "tags": [
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/beta/6fbc378a-eb0e-5840-a9c4-e7fad2215310"
                  },
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/alpha/2b740ed5-7927-5bf2-aa9b-b7803ecb321e"
                  },
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/beta/025ad556-8742-5f84-87ca-0fbc257ad72c"
                  }
                ]
              },
              "relativeStartTime": 0,
              "depth": 0,
              "hasChildren": true,
              "childSpanIds": [
                "ccadec49-86a1-5c5e-8f46-41cdeb58d769",
                "11c5d94b-e1f4-5b79-89a9-690b480ebc9b",
                "aed19320-5b14-5b0a-91a2-d04620341fad"
              ],
              "warnings": []
            }
          }
        ],
        "startTime": 1715862980533237,
        "duration": 389840,
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/feca7e99-60a1-584a-a2ef-5ca63b4a8cd6"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/4096db40-3515-52fa-b26c-e505863cf19d"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/3078b5de-6908-5d3d-926d-31719e334124"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/0c1d0ae4-5813-5b99-a4ed-79c8f2bb8d26"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/27f57bf5-1fd5-50db-9bd0-e0b2e1310fbc"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/945b92bd-0eda-5300-a84f-8cab555505a6"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/238a8818-e503-56e5-8321-1b1fd91917b7"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/de9a9e0d-c78e-53b0-b9b0-f1899ea23d69"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/d6360ac9-13d5-5dd2-a02f-533a41c62be8"
          }
        ],
        "logs": [],
        "process": {
          "processID": "eaf129a7-443b-5c99-9d56-c933bd2e52e0",
          "serviceName": "serviceA",
          "tags": [
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/gamma/b2930243-058d-5e15-8c4f-ff7b0e6abc85"
            },
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/beta/2ce6622a-1fbd-506c-8ca3-3e3365232bc5"
            }
          ]
        },
        "relativeStartTime": 246237,
        "depth": 1,
        "hasChildren": false,
        "childSpanIds": [],
        "warnings": []
      },
      {
        "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
        "processID": "4dda9e03-370f-56a2-9d1e-599ee766751a",
        "spanID": "11c5d94b-e1f4-5b79-89a9-690b480ebc9b",
        "flags": 0,
        "operationName": "MongoDB::update",
        "references": [
          {
            "refType": "CHILD_OF",
            "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
            "spanID": "5ca2149e-8576-5fb6-9481-0f8d9a338fd4",
            "span": {
              "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
              "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
              "spanID": "5ca2149e-8576-5fb6-9481-0f8d9a338fd4",
              "flags": 0,
              "operationName": "MongoDB::update",
              "references": [],
              "startTime": 1715862980287000,
              "duration": 1787120,
              "tags": [
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/0107da1a-3d04-5df0-b8fd-9486e5f6d829"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/9959df27-3f41-55a8-9016-c550ddca5dba"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/fc7d7318-7b91-508c-a798-ff6f7550882a"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/5d701328-a5f3-5106-8be5-3d2e3fd0144e"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/f091cd13-ee1e-5b06-8161-91f849067006"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/alpha/5a4db4bb-9f46-5921-8338-5d5190d9756f"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/1c2e63b2-3e6d-52a3-9016-410761304c7a"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/alpha/a2ea1f64-e799-5ca2-96b2-0c83291eaea5"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/d5ab8ff8-15c6-5144-b922-bfcd3afd66d3"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/7915d553-89d5-5c4d-a00e-fe1d0918a660"
                }
              ],
              "logs": [],
              "process": {
                "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
                "serviceName": "serviceD",
                "tags": [
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/beta/6fbc378a-eb0e-5840-a9c4-e7fad2215310"
                  },
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/alpha/2b740ed5-7927-5bf2-aa9b-b7803ecb321e"
                  },
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/beta/025ad556-8742-5f84-87ca-0fbc257ad72c"
                  }
                ]
              },
              "relativeStartTime": 0,
              "depth": 0,
              "hasChildren": true,
              "childSpanIds": [
                "ccadec49-86a1-5c5e-8f46-41cdeb58d769",
                "11c5d94b-e1f4-5b79-89a9-690b480ebc9b",
                "aed19320-5b14-5b0a-91a2-d04620341fad"
              ],
              "warnings": []
            }
          }
        ],
        "startTime": 1715862980802380,
        "duration": 439877,
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/4d805dce-c6a8-57bf-ae7c-05921e477ca9"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/4db96895-00fc-5111-8504-de725ebca47e"
          }
        ],
        "logs": [],
        "process": {
          "processID": "4dda9e03-370f-56a2-9d1e-599ee766751a",
          "serviceName": "serviceC",
          "tags": [
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/gamma/b70a121e-701a-550d-be2e-da705eae6508"
            },
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/beta/8356e39e-a2a9-5b85-8f67-4d6a398f13da"
            },
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/gamma/d1c1631c-c2c6-54b2-b1f3-47d4f28c82b2"
            },
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/gamma/2e6205a0-3b36-54a1-9668-2c9955b71578"
            }
          ]
        },
        "relativeStartTime": 515380,
        "depth": 1,
        "hasChildren": false,
        "childSpanIds": [],
        "warnings": []
      },
      {
        "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
        "processID": "eaf129a7-443b-5c99-9d56-c933bd2e52e0",
        "spanID": "ccadec49-86a1-5c5e-8f46-41cdeb58d769",
        "flags": 0,
        "operationName": "MongoDB::find",
        "references": [
          {
            "refType": "CHILD_OF",
            "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
            "spanID": "5ca2149e-8576-5fb6-9481-0f8d9a338fd4",
            "span": {
              "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
              "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
              "spanID": "5ca2149e-8576-5fb6-9481-0f8d9a338fd4",
              "flags": 0,
              "operationName": "MongoDB::update",
              "references": [],
              "startTime": 1715862980287000,
              "duration": 1787120,
              "tags": [
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/0107da1a-3d04-5df0-b8fd-9486e5f6d829"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/9959df27-3f41-55a8-9016-c550ddca5dba"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/fc7d7318-7b91-508c-a798-ff6f7550882a"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/5d701328-a5f3-5106-8be5-3d2e3fd0144e"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/f091cd13-ee1e-5b06-8161-91f849067006"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/alpha/5a4db4bb-9f46-5921-8338-5d5190d9756f"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/gamma/1c2e63b2-3e6d-52a3-9016-410761304c7a"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/alpha/a2ea1f64-e799-5ca2-96b2-0c83291eaea5"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/d5ab8ff8-15c6-5144-b922-bfcd3afd66d3"
                },
                {
                  "key": "http.url",
                  "type": "String",
                  "value": "/v2/beta/7915d553-89d5-5c4d-a00e-fe1d0918a660"
                }
              ],
              "logs": [],
              "process": {
                "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
                "serviceName": "serviceD",
                "tags": [
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/beta/6fbc378a-eb0e-5840-a9c4-e7fad2215310"
                  },
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/alpha/2b740ed5-7927-5bf2-aa9b-b7803ecb321e"
                  },
                  {
                    "key": "http.url",
                    "type": "String",
                    "value": "/v2/beta/025ad556-8742-5f84-87ca-0fbc257ad72c"
                  }
                ]
              },
              "relativeStartTime": 0,
              "depth": 0,
              "hasChildren": true,
              "childSpanIds": [
                "ccadec49-86a1-5c5e-8f46-41cdeb58d769",
                "11c5d94b-e1f4-5b79-89a9-690b480ebc9b",
                "aed19320-5b14-5b0a-91a2-d04620341fad"
              ],
              "warnings": []
            }
          }
        ],
        "startTime": 1715862981699123,
        "duration": 368545,
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/8dc39ba2-54f0-54d5-8aff-10fb4b7d9b67"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/a4242715-b95e-5c1f-a2c3-3a3f9946b86a"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/bb7ccfa7-489c-580c-b24f-b0ac13b66814"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/eb02706b-ddf3-5f17-bbc7-924e1dc88c6a"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/c14a1c71-789d-542f-b978-e3b6cd56f87e"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/ac7a89ad-8d4c-58ba-ad33-9667593e9d1f"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/e303c934-1011-5762-b36d-74e260168dd4"
          }
        ],
        "logs": [],
        "process": {
          "processID": "eaf129a7-443b-5c99-9d56-c933bd2e52e0",
          "serviceName": "serviceA",
          "tags": [
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/gamma/b2930243-058d-5e15-8c4f-ff7b0e6abc85"
            },
            {
              "key": "http.url",
              "type": "String",
              "value": "/v2/beta/2ce6622a-1fbd-506c-8ca3-3e3365232bc5"
            }
          ]
        },
        "relativeStartTime": 1412123,
        "depth": 1,
        "hasChildren": false,
        "childSpanIds": [],
        "warnings": []
      }
    ],
    "traceID": "9b52782d-12d5-5726-b54b-a8ac277caa10",
    "traceName": "serviceD: MongoDB::update",
    "tracePageTitle": "MongoDB::update (serviceD)",
    "processes": {
      "0a5a5bbf-59f9-5adc-8b54-052c80d7b4b0": {
        "processID": "0a5a5bbf-59f9-5adc-8b54-052c80d7b4b0",
        "serviceName": "serviceF",
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/44447af3-8d1a-57d2-abc3-c1b661b81d24"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/1cc154ef-b084-5339-a018-3d01fc10c003"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/33773331-d771-5c87-ac63-e6ae4cd50203"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/f3173e9a-93ff-5244-a2e6-20e79b87d687"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/c609dff6-f7c7-50bf-a05b-65a753f63a51"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/a068c427-5a7a-56f4-9975-be0d94577444"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/507e5e40-8e5e-588d-85d3-7d58938ce3a8"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/d1a3809f-7fcb-5aaa-8e84-a5fbba6a8101"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/688abf6d-95b7-5689-a9d4-f1e29167c8b6"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/03dffc3d-596e-5323-babc-05c3d61016b2"
          }
        ]
      },
      "8f0eea76-ddca-5b02-9487-e15532507264": {
        "processID": "8f0eea76-ddca-5b02-9487-e15532507264",
        "serviceName": "serviceE",
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/ad459a0f-9577-5277-b655-d45bdf6bb7e7"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/72758271-d3e7-5354-ba29-e3af568608c0"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/170cf492-87c8-5a24-bcfa-f66462e78706"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/7b7efe1d-a815-50db-815f-f125c7de5aba"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/dd0ea697-17c8-5f02-9904-dac84eef2738"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/595beeb9-84e6-5a62-a508-942ccfa059dc"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/842c7be7-88d0-59c1-9b41-8e09d68f9930"
          }
        ]
      },
      "f20fb4f7-2ac3-52ec-8581-5d684bd25655": {
        "processID": "f20fb4f7-2ac3-52ec-8581-5d684bd25655",
        "serviceName": "serviceD",
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/a60134e4-afd3-5d99-a43c-28e681a48a92"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/e2b9a203-bf6d-5a32-99b0-fb52594d22b4"
          }
        ]
      },
      "e6e4bea1-1ab3-5551-a185-fc700ecc8c25": {
        "processID": "e6e4bea1-1ab3-5551-a185-fc700ecc8c25",
        "serviceName": "serviceE",
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/7ba342f1-aa3b-5fae-bcb6-6eeafef5424d"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/99898220-36ee-55ff-8608-7635d3e973f5"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/911d546d-116a-5476-b2c3-1bd9fbf2c3fa"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/2f79b560-43be-5d19-8df6-54ac9edabf60"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/3c2a8f81-e60f-57a6-931a-56eea37e1eab"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/8d11ac62-c9b3-5ae6-80a9-bd95cc960f9e"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/1984d12a-eb94-59a0-8f68-4580937a25b8"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/5043aa74-9018-59cc-9a0c-a41b8263fbba"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/ce06fb5d-ba4e-51e5-897a-f3f1041799d3"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/75bacd8d-ee37-582d-8f72-db41bb4fd30c"
          }
        ]
      },
      "14c82e84-a507-5fc6-82f7-c5837c0ef339": {
        "processID": "14c82e84-a507-5fc6-82f7-c5837c0ef339",
        "serviceName": "serviceB",
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/e03b07f0-5d38-5ab6-9f29-4a0d57daeeb4"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/b1d26af4-c3a2-551e-b424-9fef9043d0e6"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/b1bd97da-c378-5273-815b-72c5985da105"
          }
        ]
      },
      "4dda9e03-370f-56a2-9d1e-599ee766751a": {
        "processID": "4dda9e03-370f-56a2-9d1e-599ee766751a",
        "serviceName": "serviceC",
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/b70a121e-701a-550d-be2e-da705eae6508"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/8356e39e-a2a9-5b85-8f67-4d6a398f13da"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/d1c1631c-c2c6-54b2-b1f3-47d4f28c82b2"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/2e6205a0-3b36-54a1-9668-2c9955b71578"
          }
        ]
      },
      "eaf129a7-443b-5c99-9d56-c933bd2e52e0": {
        "processID": "eaf129a7-443b-5c99-9d56-c933bd2e52e0",
        "serviceName": "serviceA",
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/gamma/b2930243-058d-5e15-8c4f-ff7b0e6abc85"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/2ce6622a-1fbd-506c-8ca3-3e3365232bc5"
          }
        ]
      },
      "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc": {
        "processID": "ac1855a6-6f7d-5e6b-83bf-b9ba16e4aacc",
        "serviceName": "serviceD",
        "tags": [
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/6fbc378a-eb0e-5840-a9c4-e7fad2215310"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/alpha/2b740ed5-7927-5bf2-aa9b-b7803ecb321e"
          },
          {
            "key": "http.url",
            "type": "String",
            "value": "/v2/beta/025ad556-8742-5f84-87ca-0fbc257ad72c"
          }
        ]
      }
    },
    "duration": 1787120,
    "startTime": 1715862980287000,
    "endTime": 1715862982074120
  };

  const criticalPath = memoizedTraceCriticalPath(trace);

  const viewRange:IViewRange = {
    time: {
      current: [0, 1],
    },
  };

  const scrollManager = new ScrollManager(trace, {
    scrollBy,
    scrollTo,
  });


  const updateViewRangeTime: TUpdateViewRangeTimeFunction = (start: number, end: number, trackSrc?: string) => {
  };

  const updateNextViewRangeTime = (update: ViewRangeTimeUpdate) => {
  };

  const isEmbedded = false;
  const headerProps = {
    focusUiFindMatches: () => {},
    slimView: false,
    textFilter: null,
    viewType: ETraceViewType.TraceTimelineViewer,
    viewRange,
    canCollapse: true,
    clearSearch: () => {},
    hideMap: false,
    hideSummary: false,
    linkToStandalone: "",
    nextResult: () => {},
    onArchiveClicked: () => {},
    onSlimViewClicked: () => {},
    onTraceViewChange: () => {},
    prevResult: () => {},
    resultCount: 1,
    disableJsonView: true,
    showArchiveButton: false,
    showShortcutsHelp: !isEmbedded,
    showStandaloneLink: isEmbedded,
    showViewOptions: !isEmbedded,
    toSearch: "",
    trace,
    updateNextViewRangeTime,
    updateViewRangeTime,
  };

  return (
    <Provider store={store}>
      <Box
        width={contentDimensions.width}
        height={contentDimensions.height}
        style={{position: "absolute"}}
      >
        <div className="Tracepage--headerSection">
          <TracePageHeader {...headerProps} />
        </div>
        <TraceTimelineViewer
            registerAccessors={scrollManager.setAccessors}
            scrollToFirstVisibleSpan={scrollManager.scrollToFirstVisibleSpan}
            findMatchesIDs={spanFindMatches}
            trace={trace}
            criticalPath={criticalPath}
            updateNextViewRangeTime={updateNextViewRangeTime}
            updateViewRangeTime={updateViewRangeTime}
            viewRange={viewRange}
          />
      </Box>
    </Provider>
  );
}
