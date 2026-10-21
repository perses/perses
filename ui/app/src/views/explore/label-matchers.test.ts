// Copyright The Perses Authors
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

import { addLabelMatcher, formatLabelMatcher } from './label-matchers';

describe('formatLabelMatcher', () => {
  it('escapes quotes and backslashes in the value', () => {
    expect(formatLabelMatcher('path', 'C:\\a "b"')).toBe('path="C:\\\\a \\"b\\""');
  });

  it('supports the negative operator', () => {
    expect(formatLabelMatcher('job', 'api', '!=')).toBe('job!="api"');
  });
});

describe('addLabelMatcher', () => {
  it.each([
    ['', '{job="api"}'],
    ['   ', '{job="api"}'],
    ['up', 'up{job="api"}'],
    ['up{}', 'up{job="api"}'],
    ['up{instance="a"}', 'up{instance="a", job="api"}'],
    ['{service_name="web"} |= "error"', '{service_name="web", job="api"} |= "error"'],
    ['sum(rate(http_requests_total{code="500"}[5m]))', 'sum(rate(http_requests_total{code="500", job="api"}[5m]))'],
    ['{msg="a}b"}', '{msg="a}b", job="api"}'],
    ['up{job="api"}', 'up{job="api"}'],
  ])('adds the matcher to %s', (query, expected) => {
    expect(addLabelMatcher(query, 'job', 'api')).toBe(expected);
  });

  it.each(['sum(up)', 'up{job="api"'])('returns undefined when %s has no usable selector', (query) => {
    expect(addLabelMatcher(query, 'job', 'api')).toBeUndefined();
  });
});
