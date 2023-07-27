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

import { DEFAULT_ALL_VALUE, VariableDefinition } from '@perses-dev/core';
import { ExternalVariableDefinition } from '@perses-dev/dashboards';
import { hydrateTemplateVariableStates } from './hydrationUtils';

describe('hydrateTemplateVariableStates', () => {
  test('normalizes single "all" value in an array', () => {
    const definitions: VariableDefinition[] = [
      {
        kind: 'ListVariable',
        spec: {
          name: 'instance',
          display: {
            name: 'Instance',
            hidden: false,
          },
          allow_all_value: true,
          allow_multiple: true,
          default_value: ['$__all'],
          plugin: {
            kind: 'PrometheusLabelValuesVariable',
            spec: {
              label_name: 'instance',
            },
          },
        },
      },
    ];
    const result = hydrateTemplateVariableStates(definitions, {});
    expect(result?.get({ name: 'instance' })?.value).toEqual(DEFAULT_ALL_VALUE);
  });
  test('external definitions overridden and overriding', () => {
    const definitions: VariableDefinition[] = [
      {
        kind: 'TextVariable',
        spec: {
          name: 'project_var',
          value: 'something',
        },
      },
      {
        kind: 'TextVariable',
        spec: {
          name: 'greetings',
          value: 'something',
        },
      },
    ];

    const externalDefinitions: ExternalVariableDefinition[] = [
      {
        source: 'project',
        definitions: [
          {
            kind: 'TextVariable',
            spec: {
              name: 'greetings',
              display: {
                name: 'Greetings(project)',
              },
              value: 'hello',
            },
          },
          {
            kind: 'TextVariable',
            spec: {
              name: 'project_var',
              value: 'something',
            },
          },
        ],
      },
      {
        source: 'global',
        definitions: [
          {
            kind: 'TextVariable',
            spec: {
              name: 'greetings',
              display: {
                name: 'Greetings(global)',
              },
              value: 'hello',
            },
          },
          {
            kind: 'TextVariable',
            spec: {
              name: 'global_var',
              value: 'global scope value',
            },
          },
        ],
      },
    ];

    const localStateResult = hydrateTemplateVariableStates(definitions, {}, externalDefinitions);

    // Verify hydration of local variable state
    expect(localStateResult.get({ name: 'project_var' })).toEqual({
      value: 'something',
      loading: false,
      overriding: true,
      overridden: false,
    });
    expect(localStateResult.get({ name: 'greetings' })).toEqual({
      value: 'something',
      loading: false,
      overriding: true,
      overridden: false,
    });

    // Verify hydration of external variable state
    expect(localStateResult.get({ source: 'project', name: 'greetings' })).toEqual({
      value: 'hello',
      loading: false,
      overriding: true,
      overridden: true,
    });
    expect(localStateResult.get({ source: 'project', name: 'project_var' })).toEqual({
      value: 'something',
      loading: false,
      overriding: false,
      overridden: true,
    });
    expect(localStateResult.get({ source: 'global', name: 'greetings' })).toEqual({
      value: 'hello',
      loading: false,
      overriding: false,
      overridden: true,
    });
    expect(localStateResult.get({ source: 'global', name: 'global_var' })).toEqual({
      value: 'global scope value',
      loading: false,
      overriding: false,
      overridden: false,
    });
  });
});
