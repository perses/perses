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
    expect(result?.instance?.value).toEqual(DEFAULT_ALL_VALUE);
  });
});
