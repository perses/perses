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

import { formatDuration } from './utils';

describe('utils', () => {
  it.each([
    [0.1, '100μs'],
    [100, '100ms'],
    [100.5, '100.5ms'],
    [100.55, '100.55ms'],
    [1000, '1s'],
    [1500, '1.5s'],
    [1550, '1.55s'],
    [1555, '1.55s'],
  ])('formatDuration(%f)', (x, expected) => {
    expect(formatDuration(x)).toEqual(expected);
  });
});
