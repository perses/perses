// Copyright 2025 The Perses Authors
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

import { replaceVariablesInString } from '@perses-dev/plugin-system';

describe('replaceVariablesInString()', () => {
  const tests = [
    {
      text: 'hello $var1 $var1',
      variableValues: { var1: { value: 'world', loading: false } },
      expected: 'hello world world',
    },
    {
      text: 'hello $var1 $var2',
      variableValues: { var1: { value: 'world', loading: false } },
      extraVariables: { var2: 'perses' },
      expected: 'hello world perses',
    },
  ];

  tests.forEach(({ text, variableValues, extraVariables, expected }) => {
    it(`replaces ${text}`, () => {
      expect(replaceVariablesInString(text, variableValues, extraVariables)).toEqual(expected);
    });
  });
});
