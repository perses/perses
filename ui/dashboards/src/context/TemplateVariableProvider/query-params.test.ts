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

import { VariableValue } from '@perses-dev/core';
import { getInitalValuesFromQueryParameters, decodeVariableValue, encodeVariableValue } from './query-params';

describe('getInitalValuesFromQueryParameters', () => {
  test('base case', () => {
    expect(
      getInitalValuesFromQueryParameters({
        'var-foo': 'bar',
        'var-baz': ['qux', 'quux'],
      })
    ).toEqual({
      foo: 'bar',
      baz: ['qux', 'quux'],
    });
  });
});

describe('encodeVariableValue', () => {
  const testCases = [
    {
      input: 'foo',
      expected: 'foo',
    },
    {
      input: ['foo', 'bar'],
      expected: 'foo,bar',
    },
    {
      input: '$__all',
      expected: '$__all',
    },
  ];

  testCases.forEach(({ input, expected }) => {
    test(`encodes ${input} as ${expected}`, () => {
      expect(encodeVariableValue(input)).toEqual(expected);
    });
  });
});

describe('decodeVariableValue', () => {
  const testCases: Array<{ input: string; expected: VariableValue }> = [
    {
      input: 'foo',
      expected: 'foo',
    },
    {
      input: 'foo,bar',
      expected: ['foo', 'bar'],
    },
    {
      input: '$__all',
      expected: '$__all',
    },
  ];

  testCases.forEach(({ input, expected }) => {
    test(`encodes ${input} as ${expected}`, () => {
      expect(decodeVariableValue(input)).toEqual(expected);
    });
  });
});
