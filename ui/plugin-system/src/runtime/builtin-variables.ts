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

import { createContext, useContext, useMemo } from 'react';
import { BuiltinVariableDefinition } from '@perses-dev/core';
import { VariableStateMap } from './template-variables';

export type BuiltinVariables = Record<string, BuiltinVariableDefinition>;

export type BuiltinVariableSrv = {
  variables: BuiltinVariables;
};

export const BuiltinVariableContext = createContext<BuiltinVariableSrv | undefined>(undefined);

export function useBuiltinVariableContext() {
  const ctx = useContext(BuiltinVariableContext);
  if (ctx === undefined) {
    throw new Error('No BuiltinVariableContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useBuiltinVariableValues(names?: string[]): VariableStateMap {
  const { variables } = useBuiltinVariableContext();
  const states = useMemo(() => {
    const values: VariableStateMap = {};
    for (const key in variables) {
      const variable = variables[key];
      if (variable !== undefined) {
        values[key] = { loading: false, value: variable.spec.value() };
      }
    }
    return values;
  }, [variables]);

  const values = useMemo(() => {
    const values: VariableStateMap = {};
    names?.forEach((name) => {
      const s = states[name];
      if (s) {
        values[name] = s;
      }
    });
    return values;
  }, [names, states]);

  if (names === undefined) {
    return states;
  }

  return values;
}

export function useBuiltinVariableDefinitions(): BuiltinVariableDefinition[] {
  const { variables } = useBuiltinVariableContext();
  return Object.values(variables).map((v) => v);
}
