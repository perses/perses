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

import { VariableOption } from '@perses-dev/plugin-system';
import { VariableDefinition } from '@perses-dev/core';
import { filterVariableList, checkSavedVariablesStatus } from './variable-model';

describe('filterVariableList', () => {
  const testSuite = [
    {
      title: 'basic case',
      capturing_regexp: /([^-]*)-host-([^-]*)/g,
      originalValues: [
        { label: 'l1', value: 'us1-host-ahdix' },
        { label: 'l2', value: 'us1-host-diua' },
        { label: 'l3', value: 'eu1-host-adf' },
        { label: 'l4', value: 'bar' },
      ] as VariableOption[],
      result: [
        { label: 'l1', value: 'us1ahdix' },
        { label: 'l2', value: 'us1diua' },
        { label: 'l3', value: 'eu1adf' },
      ],
    },
    {
      title: 'duplicate captured value',
      capturing_regexp: /prometheus-(.+):\d+/g,
      originalValues: [
        { label: 'l1', value: 'prometheus-app:9090' },
        { label: 'l2', value: 'prometheus-app:9091' },
        { label: 'l3', value: 'prometheus-platform:9091' },
        { label: 'l4', value: 'prometheus-database:9091' },
        { label: 'l5', value: 'prometheus-perses:9091' },
      ] as VariableOption[],
      result: [
        { label: 'l1', value: 'app' },
        { label: 'l3', value: 'platform' },
        { label: 'l4', value: 'database' },
        { label: 'l5', value: 'perses' },
      ],
    },
  ];
  testSuite.forEach(({ title, capturing_regexp, originalValues, result }) => {
    it(title, () => {
      expect(filterVariableList(originalValues, capturing_regexp)).toEqual(result);
    });
  });
});

describe('checkSavedVariablesStatus', () => {
  it('should check whether saved variable definitions are out of date with current default values state', () => {
    const savedVariables: VariableDefinition[] = [
      {
        kind: 'ListVariable',
        spec: {
          name: 'interval',
          default_value: '1m',
          allow_all_value: false,
          allow_multiple: false,
          plugin: {
            kind: 'StaticListVariable',
            spec: {
              values: ['1m', '5m'],
            },
          },
        },
      },
      {
        kind: 'ListVariable',
        spec: {
          name: 'NewListVariable',
          display: {
            name: 'Test display label',
            hidden: false,
          },
          default_value: 'second list value',
          allow_all_value: true,
          allow_multiple: false,
          plugin: {
            kind: 'StaticListVariable',
            spec: {
              values: [
                {
                  label: 'test list value',
                  value: 'test list value',
                },
                {
                  label: 'second list value',
                  value: 'second list value',
                },
                {
                  label: 'another list value',
                  value: 'another list value',
                },
              ],
            },
          },
        },
      },
      {
        kind: 'TextVariable',
        spec: {
          name: 'NewTextVariable',
          display: {
            name: 'Text display',
            hidden: false,
          },
          value: 'first text value',
        },
      },
    ];
    const variableState = {
      interval: {
        value: '5m',
        loading: false,
        options: [
          {
            label: '1m',
            value: '1m',
          },
          {
            label: '5m',
            value: '5m',
          },
        ],
      },
      NewListVariable: {
        value: 'last list value',
        loading: false,
        options: [
          {
            label: 'test list value',
            value: 'test list value',
          },
          {
            label: 'second list value',
            value: 'second list value',
          },
          {
            label: 'last list value',
            value: 'last list value',
          },
        ],
        default_value: 'test list value',
      },
      NewTextVariable: {
        value: 'New text value',
        loading: false,
      },
    };
    const isSavedVariablesOutdated = checkSavedVariablesStatus(savedVariables, variableState);
    expect(isSavedVariablesOutdated).toBe(true);
  });
});
