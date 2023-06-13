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

import { isOddMinutes } from './utils';

describe('isOddMinutes', () => {
  test('returns true for odd minutes', () => {
    const timestamp = 1623591545000; // Unix timestamp with odd minutes
    expect(isOddMinutes(timestamp)).toBe(true);
  });

  test('returns false for even minutes', () => {
    const timestamp = 1623591600000; // Unix timestamp with even minutes
    expect(isOddMinutes(timestamp)).toBe(false);
  });
});

In this example, we define a Jest test suite using describe and add two test cases using test. The first test case verifies that isOddMinutes returns true for a Unix timestamp with odd minutes, while the second test case checks that it returns false for a Unix timestamp with even minutes.

You can run this test using Jest, and it should validate the behavior of the isOddMinutes function for different Unix timestamp inputs.
