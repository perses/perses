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

import { MOCK_TRACE, MOCK_TRACE_ASYNC } from '../../../test';
import { getTraceModel } from './trace';

describe('trace', () => {
  it('computes a GanttTrace model from a trace', () => {
    const ganttTrace = getTraceModel(MOCK_TRACE);
    expect(ganttTrace.startTimeUnixMs).toEqual(1000);
    expect(ganttTrace.endTimeUnixMs).toEqual(2000);
  });

  it('computes a GanttTrace model from a trace where trace duration != root span duration', () => {
    const ganttTrace = getTraceModel(MOCK_TRACE_ASYNC);
    expect(ganttTrace.startTimeUnixMs).toEqual(1729001599633.602);
    expect(ganttTrace.endTimeUnixMs).toEqual(1729001599964.748);
  });
});
