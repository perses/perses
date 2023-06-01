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

import { VariableDefinition } from '@perses-dev/core';
import { isSavedVariableModified } from './utils';

describe('isSavedVariableModified', () => {
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
    expect(isSavedVariableModified(savedVariables, variableState)).toBe(true);
  });

  it('should confirm list variable default value was not modified', () => {
    const savedVariables: VariableDefinition[] = [
      {
        kind: 'ListVariable',
        spec: {
          name: 'interval',
          default_value: '5m',
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
    ];
    const variableState = {
      interval: {
        value: '5m',
        default_value: '5m',
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
    };
    expect(isSavedVariableModified(savedVariables, variableState)).toBe(false);
  });

  it('should confirm null list variable was not modified', () => {
    const savedVariables: VariableDefinition[] = [
      {
        kind: 'ListVariable',
        spec: {
          allow_all_value: false,
          allow_multiple: false,
          plugin: {
            kind: 'StaticListVariable',
            spec: {
              values: [],
            },
          },
          name: 'EmptyListVariableTest',
        },
      },
    ];
    const variableState = {
      EmptyListVariableTest: {
        value: null,
        loading: false,
        options: [],
      },
    };
    expect(isSavedVariableModified(savedVariables, variableState)).toBe(false);
  });

  it('should confirm text variable value was not modified', () => {
    const savedVariables: VariableDefinition[] = [
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
      NewTextVariable: {
        value: 'first text value',
        loading: false,
      },
    };
    expect(isSavedVariableModified(savedVariables, variableState)).toBe(false);
  });

  it('should confirm text variable value was modified', () => {
    const savedVariables: VariableDefinition[] = [
      {
        kind: 'TextVariable',
        spec: {
          name: 'NewTextVariable',
          value: 'Lorem ipsum',
        },
      },
    ];
    const variableState = {
      NewTextVariable: {
        value: 'updated text value',
        loading: false,
      },
    };
    expect(isSavedVariableModified(savedVariables, variableState)).toBe(true);
  });
});
