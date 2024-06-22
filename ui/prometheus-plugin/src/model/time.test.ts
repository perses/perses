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

import { getRangeStep } from './time';

describe('getRangeStep', () => {
  it('should return the provided min step when the time range is narrow', () => {
    // = 5m time range
    const timerangeStart = 1718956800; // Fri Jun 21 2024 08:00:00 GMT+0000
    const timerangeEnd = 1718957100; // Fri Jun 21 2024 08:05:00 GMT+0000
    const minStepSeconds = 15;
    const resolution = 1;
    const suggestedStepMs = 200;
    expect(
      getRangeStep({ start: timerangeStart, end: timerangeEnd }, minStepSeconds, resolution, suggestedStepMs)
    ).toEqual(minStepSeconds);
  });

  it('should return the suggested step when the time range is wide enough', () => {
    // = 2w time range
    const timerangeStart = 1718956800; // Fri Jun 21 2024 08:00:00 GMT+0000
    const timerangeEnd = 1720166400; // Fri Jul 05 2024 08:00:00 GMT+0000
    const minStepSeconds = 15;
    const resolution = 1;
    const suggestedStepMs = 600000;
    expect(
      getRangeStep({ start: timerangeStart, end: timerangeEnd }, minStepSeconds, resolution, suggestedStepMs)
    ).toEqual(suggestedStepMs / 1000);
  });
});
