// Copyright (c) 2023 The Jaeger Authors
//
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

import transformTraceData from '../../../../model/transform-trace-data';
/*
                                                  |
      ┌──────────┐                                |
      │ Span A   │                                |          span A
      └──────────┘                                |           /
      ++++++++++++    ┌───────────────────┐       |          /
                      │      Span B       │       |      span B
                      └───────────────────┘       |
                                                  |   (parent-child tree)
                                                  | 
Span B will be dropped.                           |
span A is on critical path(+++++)                 |
*/

import trace from '../../TraceStatistics/tableValuesTestTrace/traceWithSingleChildLongerThanParentAndStartsAfterParent.json';

const transformedTrace = transformTraceData(trace);
const traceStart = 100;

const criticalPathSections = [
  {
    spanId: '006c3cf93508f205',
    section_start: traceStart,
    section_end: traceStart + 40,
  },
];

const test3 = {
  criticalPathSections,
  trace: transformedTrace,
};

export default test3;
