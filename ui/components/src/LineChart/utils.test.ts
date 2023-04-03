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

import { getFormattedDate } from './utils';

describe('getFormattedDate', () => {
  it('should round value to nearest five minutes when pastDuration 1h', () => {
    const xAxisLabel = getFormattedDate('1680533160000', 3600000);
    expect(xAxisLabel).toEqual('14:45');
  });

  it('should round value to nearest five minutes when pastDuration 1d', () => {
    const xAxisLabel = getFormattedDate('1680527760000', 86400000);
    expect(xAxisLabel).toEqual('4/3 13:15');
  });

  it('should not round value to nearest five minutes when pastDuration 5m', () => {
    const xAxisLabel = getFormattedDate('1680533385000', 300000);
    expect(xAxisLabel).toEqual('14:49:45');
  });
});
