// Copyright 2021 The Perses Authors
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

import { createContext, useContext } from 'react';
import { VariablesState } from '@perses-dev/core';

export type TemplateVariableSrv = {
  state: VariablesState;
};

export const TemplateVariableContext = createContext<TemplateVariableSrv | undefined>(undefined);

function useTemplateVariableContext() {
  const ctx = useContext(TemplateVariableContext);
  if (ctx === undefined) {
    throw new Error('No TemplateVariableContextV2 found. Did you forget a Provider?');
  }
  return ctx;
}

export function useTemplateVariableValues(names?: string[]) {
  const { state } = useTemplateVariableContext();

  if (names === undefined) {
    return state;
  }

  const values: VariablesState = {};
  names.forEach((name) => {
    const s = state[name];
    if (s) {
      values[name] = s;
    }
  });

  return values;
}
