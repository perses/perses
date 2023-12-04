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

import { useListVariableState } from '@perses-dev/dashboards';
import { renderHook } from '@testing-library/react';
import { VariableValue } from '@perses-dev/core';
import { VariableOption } from '@perses-dev/plugin-system';

/**
 * Builder shortcut used in test to build a dummy option from value.
 * @param value
 */
function option(value: string): VariableOption {
  return {
    label: '',
    value,
  };
}

/**
 * Builder shortcut used in test to build an "all" option
 */
function allOption(): VariableOption {
  return {
    label: 'All',
    value: '$__all',
  };
}

/**
 * struct used in tests for following parametrized tests
 */
interface TestParams {
  description: string;
  input: {
    allowMultiple: boolean;
    allowAllValue: boolean;
    value: VariableValue;
    isFetchingOptions: boolean;
    fetchedOptions: VariableOption[];
  };
  output: {
    value: VariableValue;
    loading: boolean;
    options: VariableOption[];
    selectedOptions: VariableOption | VariableOption[];
    viewOptions: VariableOption[];
  };
}

describe('useListVariableState', () => {
  it.each([
    {
      description: '[!ALL][!MULTIPLE] is fetching',
      input: {
        allowMultiple: false,
        allowAllValue: false,
        value: 'hello',
        isFetchingOptions: true,
        fetchedOptions: [option('hello')],
      },
      output: {
        value: 'hello',
        loading: true,
        options: [option('hello')],
        selectedOptions: option('hello'),
        viewOptions: [option('hello')],
      },
    },
    {
      description: '[!ALL][!MULTIPLE] state.value is in options',
      input: {
        allowMultiple: false,
        allowAllValue: false,
        value: 'hello',
        isFetchingOptions: false,
        fetchedOptions: [option('hello')],
      },
      output: {
        value: 'hello',
        loading: false,
        options: [option('hello')],
        selectedOptions: option('hello'),
        viewOptions: [option('hello')],
      },
    },
    {
      description: '[ALL][MULTIPLE] state.value is in options',
      input: {
        allowMultiple: true,
        allowAllValue: true,
        value: 'hello',
        isFetchingOptions: false,
        fetchedOptions: [option('hello')],
      },
      output: {
        value: ['hello'],
        loading: false,
        options: [option('hello')],
        selectedOptions: [option('hello')],
        viewOptions: [allOption(), option('hello')],
      },
    },
    {
      description: '[!ALL][!MULTIPLE] state.value is null',
      input: {
        allowMultiple: false,
        allowAllValue: false,
        value: null,
        isFetchingOptions: false,
        fetchedOptions: [option('hello')],
      },
      output: {
        value: 'hello',
        loading: false,
        options: [option('hello')],
        selectedOptions: option('hello'),
        viewOptions: [option('hello')],
      },
    },
    {
      description: '[ALL][MULTIPLE] state.value is null',
      input: {
        allowMultiple: true,
        allowAllValue: true,
        value: null,
        isFetchingOptions: false,
        fetchedOptions: [option('hello')],
      },
      output: {
        value: ['hello'],
        loading: false,
        options: [option('hello')],
        selectedOptions: [option('hello')],
        viewOptions: [allOption(), option('hello')],
      },
    },
    {
      description: '[!ALL][!MULTIPLE] state.value is not in options',
      input: {
        allowMultiple: false,
        allowAllValue: false,
        value: 'test',
        isFetchingOptions: false,
        fetchedOptions: [option('hello')],
      },
      output: {
        value: 'hello',
        loading: false,
        options: [option('hello')],
        selectedOptions: option('hello'),
        viewOptions: [option('hello')],
      },
    },
    {
      description: '[ALL][MULTIPLE] state.value is not in options',
      input: {
        allowMultiple: true,
        allowAllValue: true,
        value: 'test',
        isFetchingOptions: false,
        fetchedOptions: [option('hello')],
      },
      output: {
        value: ['hello'],
        loading: false,
        options: [option('hello')],
        selectedOptions: [option('hello')],
        viewOptions: [allOption(), option('hello')],
      },
    },
  ])('$description', (params: TestParams) => {
    const { result } = renderHook(() =>
      useListVariableState(
        {
          name: 'myVar', // unused by the hook
          plugin: { spec: {}, kind: 'unknown-plugin' }, // unused by the hook
          allowMultiple: params.input.allowMultiple,
          allowAllValue: params.input.allowAllValue,
        },
        {
          value: params.input.value,
          loading: false, // unused by the hook
        },
        {
          isFetching: params.input.isFetchingOptions,
          data: params.input.fetchedOptions,
        }
      )
    );

    expect(result.current).toStrictEqual({
      value: params.output.value,
      loading: params.output.loading,
      options: params.output.options,
      selectedOptions: params.output.selectedOptions,
      viewOptions: params.output.viewOptions,
    });
  });
});
