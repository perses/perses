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

import { parseTemplateVariables, replaceTemplateVariable, replaceTemplateVariables, formatSeriesName } from './utils';

describe('parseTemplateVariables()', () => {
  const tests = [
    {
      text: 'hello $var1 world $var2',
      variables: ['var1', 'var2'],
    },
  ];

  tests.forEach(({ text, variables }) => {
    it(`parses ${text}`, () => {
      expect(parseTemplateVariables(text)).toEqual(variables);
    });
  });
});

describe('replaceTemplateVariable()', () => {
  const tests = [
    {
      text: 'hello $var1',
      varName: 'var1',
      value: 'world',
      expected: 'hello world',
    },
    {
      text: 'hello $var1 $var1',
      varName: 'var1',
      value: 'world',
      expected: 'hello world world',
    },
    {
      text: 'hello $var1',
      varName: 'var1',
      value: ['world', 'w'],
      expected: 'hello (world|w)',
    },
    {
      text: 'hello $var1 $var1',
      varName: 'var1',
      value: ['world', 'w'],
      expected: 'hello (world|w) (world|w)',
    },
  ];

  tests.forEach(({ text, value, varName, expected }) => {
    it(`replaces ${text} ${value}`, () => {
      expect(replaceTemplateVariable(text, varName, value)).toEqual(expected);
    });
  });
});

describe('replaceTemplateVariables()', () => {
  const tests = [
    {
      text: 'hello $var1 $var2',
      state: {
        var1: { value: 'world', loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello world world',
    },
    {
      text: 'hello $var1 $var2',
      state: {
        var1: { value: 'world', loading: false },
        var2: { value: ['a', 'b'], loading: false },
      },
      expected: 'hello world (a|b)',
    },
  ];

  tests.forEach(({ text, state, expected }) => {
    it(`replaces ${text} ${JSON.stringify(state)}`, () => {
      expect(replaceTemplateVariables(text, state)).toEqual(expected);
    });
  });
});

describe('formatSeriesName', () => {
  it('should resolve label name tokens to label values from query response', () => {
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
