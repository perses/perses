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

import { parseVariables, replaceVariable, replaceVariables } from './variables';

describe('parseVariables()', () => {
  const tests = [
    {
      text: 'hello $var1 world $var2',
      variables: ['var1', 'var2'],
    },
  ];

  tests.forEach(({ text, variables }) => {
    it(`parses ${text}`, () => {
      expect(parseVariables(text)).toEqual(variables);
    });
  });
});

describe('replaceVariable()', () => {
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
      expect(replaceVariable(text, varName, value)).toEqual(expected);
    });
  });
});

describe('replaceVariables()', () => {
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
    {
      text: 'hello $var1 $var2 $var3',
      state: {
        var1: { value: 'world', loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello world world $var3',
    },
  ];

  tests.forEach(({ text, state, expected }) => {
    it(`replaces ${text} ${JSON.stringify(state)}`, () => {
      expect(replaceVariables(text, state)).toEqual(expected);
    });
  });
});

describe('replaceVariables() with custom formats', () => {
  const tests = [
    // csv
    {
      text: 'hello ${var1:csv} ${var2:csv}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses,prometheus world',
    },
    // distributed
    {
      text: 'hello ${var1:distributed} ${var2:distributed}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses,var1=prometheus world',
    },
    {
      text: 'hello ${var1:distributed} ${var2:distributed}',
      state: {
        var1: { value: ['perses', 'prometheus', 'timeseries'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses,var1=prometheus,var1=timeseries world',
    },
    // doublequote
    {
      text: 'hello ${var1:doublequote} ${var2:doublequote}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello "perses","prometheus" "world"',
    },
    // glob
    {
      text: 'hello ${var1:glob} ${var2:glob}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello {perses,prometheus} {world}',
    },
    // json
    {
      text: 'hello ${var1:json} ${var2:json}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello ["perses","prometheus"] ["world"]',
    },
    // lucene
    {
      text: 'hello ${var1:lucene} ${var2:lucene}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello ("perses" OR "prometheus") ("world")',
    },
    // percentencode
    {
      text: 'hello ${var1:percentencode} ${var2:percentencode}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses%2Cprometheus world',
    },
    // pipe
    {
      text: 'hello ${var1:pipe} ${var2:pipe}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses|prometheus world',
    },
    // raw
    {
      text: 'hello ${var1:raw} ${var2:raw}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses,prometheus world',
    },
    // regex
    {
      text: 'hello ${var1:regex} ${var2:regex}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello (perses|prometheus) (world)',
    },
    {
      text: 'hello ${var1:regex} ${var2:regex}',
      state: {
        var1: { value: ['perses.', 'prometheus$'], loading: false },
        var2: { value: 'world.', loading: false },
      },
      expected: 'hello (perses\\.|prometheus\\$) (world\\.)',
    },
    // singlequote
    {
      text: 'hello ${var1:singlequote} ${var2:singlequote}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: "hello 'perses','prometheus' 'world'",
    },
    // sqlstring
    {
      text: 'hello ${var1:sqlstring} ${var2:sqlstring}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: "hello 'perses','prometheus' 'world'",
    },
    {
      text: 'hello ${var1:sqlstring} ${var2:sqlstring}',
      state: {
        var1: { value: ["perses'", 'prometheus'], loading: false },
        var2: { value: "world'", loading: false },
      },
      expected: "hello 'perses''','prometheus' 'world'''",
    },
    // text
    {
      text: 'hello ${var1:text} ${var2:text}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses + prometheus world',
    },
    // queryparam
    {
      text: 'hello ${var1:queryparam} ${var2:queryparam}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello var1=perses&var1=prometheus var2=world',
    },
  ];

  tests.forEach(({ text, state, expected }) => {
    it(`replaces ${text} ${JSON.stringify(state)}`, () => {
      expect(replaceVariables(text, state)).toEqual(expected);
    });
  });
});
