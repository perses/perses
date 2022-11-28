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

import { VariableOption } from '@perses-dev/plugin-system';
import { filterVariableList } from './variable-model';

describe('filterVariableList', () => {
  const testSuite = [
    {
      title: 'basic case',
      capturing_regexp: /([^-]*)-host-([^-]*)/g,
      originalValues: [
        { value: 'us1-host-ahdix' },
        { value: 'us1-host-diua' },
        { value: 'eu1-host-adf' },
        { value: 'bar' },
      ] as VariableOption[],
      result: [{ value: 'us1ahdix' }, { value: 'us1diua' }, { value: 'eu1adf' }],
    },
    {
      title: 'duplicate captured value',
      capturing_regexp: /prometheus-(.+):\d+/g,
      originalValues: [
        { value: 'prometheus-app:9090' },
        { value: 'prometheus-app:9091' },
        { value: 'prometheus-platform:9091' },
        { value: 'prometheus-database:9091' },
        { value: 'prometheus-perses:9091' },
      ] as VariableOption[],
      result: [{ value: 'app' }, { value: 'platform' }, { value: 'database' }, { value: 'perses' }],
    },
  ];
  testSuite.forEach(({ title, capturing_regexp, originalValues, result }) => {
    it(title, () => {
      expect(filterVariableList(originalValues, capturing_regexp)).toEqual(result);
    });
  });
});
