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

import { VariableValue, VariableDefinition } from '@perses-dev/core';
import { VariableStateMap, VariableState, DEFAULT_ALL_VALUE } from '@perses-dev/plugin-system';

// TODO: move to TemplateVariableProvider/utils.ts
function hydrateTemplateVariableState(variable: VariableDefinition, initialValue?: VariableValue) {
  const varState: VariableState = {
    value: null,
    loading: false,
  };
  switch (variable.kind) {
    case 'TextVariable':
      varState.value = initialValue ?? variable.spec.value;
      break;
    case 'ListVariable':
      varState.options = [];
      varState.value = initialValue ?? variable.spec.default_value ?? null;
      // TODO: smarter fallbacks for default_value when allow_all_value is true
      if (varState.options.length > 0 && !varState.value) {
        const firstOptionValue = varState.options[0]?.value ?? null;
        if (firstOptionValue !== null) {
          varState.value = variable.spec.allow_multiple ? [firstOptionValue] : firstOptionValue;
        }
      }

      // "all" variable handling assumes the value is not in an array. This is
      // handled properly during internal variable interactions, but it is possible
      // to end up in a buggy state if the variables are initialized with an "all"
      // value inside an array. When hydrating variables, normalize this to minimize
      // bugs.
      if (Array.isArray(varState.value) && varState.value.length === 1 && varState.value[0] === DEFAULT_ALL_VALUE) {
        varState.value = DEFAULT_ALL_VALUE;
      }

      break;
    default:
      break;
  }
  return varState;
}

export function hydrateTemplateVariableStates(
  definitions: VariableDefinition[],
  initialValues: Record<string, VariableValue>
): VariableStateMap {
  const state: VariableStateMap = {};
  definitions.forEach((v) => {
    const name = v.spec.name;
    const param = initialValues[name];
    const initialValue = param ? param : null;
    state[name] = hydrateTemplateVariableState(v, initialValue);
  });

  return state;
}
