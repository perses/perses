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
import { VariableName, VariableValue } from '@perses-dev/core';
import { VariableOption } from '../model';
import { parseTemplateVariables, replaceTemplateVariables } from '../utils';

export type VariableState = {
  value: VariableValue;
  options?: VariableOption[];
  loading: boolean;
  error?: Error;
};

export type VariableStateMap = Record<VariableName, VariableState>;

export type TemplateVariableSrv = {
  state: VariableStateMap;
};

export const TemplateVariableContext = createContext<TemplateVariableSrv | undefined>(undefined);

function useTemplateVariableContext() {
  const ctx = useContext(TemplateVariableContext);
  if (ctx === undefined) {
    throw new Error('No TemplateVariableContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useTemplateVariableValues(names?: string[]) {
  const { state } = useTemplateVariableContext();

  const values = useMemo(() => {
    const values: VariableStateMap = {};
    names?.forEach((name) => {
      const s = state[name];
      if (s) {
        values[name] = s;
      }
    });
    return values;
  }, [state, names]);

  if (names === undefined) {
    return state;
  }

  return values;
}

// Convenience hook for replacing template variables in a string
export function useReplaceVariablesInString(str: string | undefined): string | undefined {
  const variablesInString = str ? parseTemplateVariables(str) : [];
  const variableValues = useTemplateVariableValues(variablesInString);
  if (!str) return undefined;
  return replaceTemplateVariables(str, variableValues);
}
