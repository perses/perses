// Copyright 2022 The Perses Authors
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

import { formatSeriesName } from './time-series-queries';

describe('formatSeriesName', () => {
  it('should resolve label name tokens with resolved labels from query', () => {
    // example from query: node_load15{instance=~\"(demo.do.prometheus.io:9100)\",job='$job'}
    const inputFormat = 'Test {{job}} {{instance}}';

    const metric = {
      __name__: 'node_load15',
      env: 'demo',
      instance: 'demo.do.prometheus.io:9100',
      job: 'node',
    };

    const output = 'Test node demo.do.prometheus.io:9100';

    expect(formatSeriesName(inputFormat, metric)).toEqual(output);
  });
});
