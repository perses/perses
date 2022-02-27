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

import { useMemo, useCallback, createContext, useContext } from 'react';
import { useImmer } from 'use-immer';
import { DashboardSpec, TemplateVariablesContext, TemplateVariables, VariableState } from '@perses-dev/core';

export interface TemplateVariablesProviderProps {
  children?: React.ReactNode;
  variableDefinitions: DashboardSpec['variables'];
}

/**
 * Provider implementation that supplies the TemplateVariables at runtime.
 */
export function TemplateVariablesProvider(props: TemplateVariablesProviderProps) {
  const { children, variableDefinitions } = props;

  // TODO: Do we need to support re-init if variableDefinitions changes?
  const [state, setState] = useImmer<TemplateVariables['variables']>(() => {
    const variables: Record<string, VariableState> = {};
    Object.entries(variableDefinitions).forEach(([variableName, definition]) => {
      variables[variableName] = {
        value: definition.selection.default_value,
        options: undefined,
      };
    });
    return variables;
  });

  const setValue: TemplateVariablesSetters['setValue'] = useCallback(
    (name, next) => {
      const variableDef = variableDefinitions[name];
      if (variableDef === undefined) {
        throw new Error(`Unknown variable '${name}'`);
      }

      const defaultValue = variableDef.selection.default_value;
      const allValue = 'all_value' in variableDef.selection ? variableDef.selection.all_value : undefined;
      if (typeof defaultValue === 'object') {
        // Shouldn't be able to assign a string to a multi select
        if (typeof next !== 'object') {
          throw new Error(`Invalid value '${next}' for multi-select`);
        }

        // If selections are completely removed, just go back to the default
        // value
        if (next.length === 0) {
          next = defaultValue;
        }
      } else {
        // Shouldn't be able to assign a string[] to a single select
        if (typeof next !== 'string') {
          throw new Error(`Invalid value '${next}' for single-select`);
        }
      }

      setState((draft) => {
        const variableState = draft[name];
        if (variableState === undefined) {
          throw new Error(`Unknown variable '${name}'`);
        }

        // If the "All" value is in the next selections, we need to either
        // remove it (because they selected something more specific) or
        // ensure it's the only selection (because they just selected it)
        if (allValue !== undefined && typeof next === 'object' && next.length > 1 && next.includes(allValue)) {
          const current = variableState.value;
          if (typeof current === 'object') {
            const hasAll = current.includes(allValue);
            if (hasAll) {
              next = next.filter((val) => val !== allValue);
            } else {
              next = [allValue];
            }
          }
        }

        variableState.value = next;
      });
    },
    [setState, variableDefinitions]
  );

  const setOptions: TemplateVariablesSetters['setOptions'] = useCallback(
    (name, options) => {
      const variableDef = variableDefinitions[name];
      if (variableDef === undefined) {
        throw new Error(`Unknown variable '${name}'`);
      }

      let capturingRegex: RegExp | undefined = undefined;
      if (variableDef.capturing_regexp !== undefined) {
        let pattern = variableDef.capturing_regexp;
        let flags = '';

        // Regex expressions can start with / so that flags can be provided
        // at the end, so account for those
        if (pattern.startsWith('/')) {
          const endIdx = pattern.lastIndexOf('/');
          if (endIdx > 0) {
            flags = pattern.substring(endIdx + 1);
            pattern = pattern.substring(1, endIdx);
          }
        }

        // TODO: Do we need to account for stateful flags (gy) and create a
        // new Regex each time to compare an option to?
        capturingRegex = new RegExp(pattern, flags);
      }

      // Get the unique options, optionally running the capturing regex
      const uniqueOptions = new Set<string>();
      options.forEach((option) => {
        if (capturingRegex !== undefined) {
          const match = capturingRegex.exec(option);
          if (match !== null && match[0] !== undefined) {
            option = match[0];
          }
        }
        uniqueOptions.add(option);
      });

      // Set the options in variable state
      setState((draft) => {
        const variableState = draft[name];
        if (variableState === undefined) {
          throw new Error(`Unknown variable '${name}'`);
        }
        variableState.options = Array.from(uniqueOptions);
      });
    },
    [setState, variableDefinitions]
  );

  // Memo since it's being passed via context
  const ctx = useMemo(() => ({ variables: state }), [state]);
  const setters = useMemo(() => ({ setValue, setOptions }), [setValue, setOptions]);

  return (
    <TemplateVariablesSettersContext.Provider value={setters}>
      <TemplateVariablesContext.Provider value={ctx}>{children}</TemplateVariablesContext.Provider>
    </TemplateVariablesSettersContext.Provider>
  );
}

/**
 * Setters for manipulating Template Variable state.
 */
export interface TemplateVariablesSetters {
  setValue: (name: string, value: string | string[]) => void;
  setOptions: (name: string, options: string[]) => void;
}

export const TemplateVariablesSettersContext = createContext<TemplateVariablesSetters | undefined>(undefined);

/**
 * Gets the setters for Template Variables provided by the TemplateVariablesProvider at runtime.
 */
export function useTemplateVariablesSetters() {
  const ctx = useContext(TemplateVariablesSettersContext);
  if (ctx === undefined) {
    throw new Error('No TemplateVariablesSettersContext found. Did you forget a Provider?');
  }
  return ctx;
}
