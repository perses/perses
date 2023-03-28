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

import { createContext, useContext, useMemo, useState } from 'react';
import { createStore, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

import {
  TemplateVariableContext,
  VariableStateMap,
  VariableState,
  VariableOption,
  DEFAULT_ALL_VALUE as ALL_VALUE,
} from '@perses-dev/plugin-system';
import { VariableName, VariableValue, VariableDefinition } from '@perses-dev/core';
import { hydrateTemplateVariableStates } from './hydrationUtils';
import { useVariableQueryParams, getInitalValuesFromQueryParameters, getURLQueryParamName } from './query-params';

type TemplateVariableStore = {
  variableDefinitions: VariableDefinition[];
  variableState: VariableStateMap;
  setVariableValue: (variableName: VariableName, value: VariableValue) => void;
  setVariableOptions: (name: VariableName, options: VariableOption[]) => void;
  setVariableLoading: (name: VariableName, loading: boolean) => void;
  setVariableDefinitions: (definitions: VariableDefinition[]) => void;
};

const TemplateVariableStoreContext = createContext<ReturnType<typeof createTemplateVariableSrvStore> | undefined>(
  undefined
);
function useTemplateVariableStoreCtx() {
  const context = useContext(TemplateVariableStoreContext);
  if (!context) {
    throw new Error('TemplateVariableStoreContext not initialized');
  }
  return context;
}

export function useTemplateVariableValues(variableNames?: string[]) {
  const store = useTemplateVariableStoreCtx();
  const state = useStore(
    store,
    (s) => {
      const names = variableNames ?? Object.keys(s.variableState);
      const vars: VariableStateMap = {};
      names.forEach((name) => {
        const varState = s.variableState[name];
        if (!varState) {
          return;
        }
        vars[name] = varState;
      });
      return vars;
    },
    (left, right) => {
      return JSON.stringify(left) === JSON.stringify(right);
    }
  );
  return state;
}

export function useTemplateVariable(name: string) {
  const store = useTemplateVariableStoreCtx();
  return useStore(store, (s) => {
    const variableState = s.variableState[name];
    const definition = s.variableDefinitions.find((v) => v.spec.name === name);
    return {
      state: variableState,
      definition,
    };
  });
}

export function useTemplateVariableActions() {
  const store = useTemplateVariableStoreCtx();
  return useStore(store, (s) => {
    return {
      setVariableValue: s.setVariableValue,
      setVariableLoading: s.setVariableLoading,
      setVariableOptions: s.setVariableOptions,
      setVariableDefinitions: s.setVariableDefinitions,
    };
  });
}

export function useTemplateVariableDefinitions() {
  const store = useTemplateVariableStoreCtx();
  return useStore(store, (s) => s.variableDefinitions);
}

export function useTemplateVariableStore() {
  const store = useTemplateVariableStoreCtx();
  return useStore(store);
}

function PluginProvider({ children }: { children: React.ReactNode }) {
  const originalValues = useTemplateVariableValues();

  const values = useMemo(() => {
    const contextValues: VariableStateMap = {};

    // This will loop through all the current variables values
    // and update any variables that have ALL_VALUE as their current value
    // to include all options.
    Object.keys(originalValues).forEach((name) => {
      const v = { ...originalValues[name] } as VariableState;
      if (v.value === ALL_VALUE) {
        v.value = v.options?.map((o: { value: string }) => o.value) ?? null;
      }
      contextValues[name] = v;
    });
    return contextValues;
  }, [originalValues]);

  return <TemplateVariableContext.Provider value={{ state: values }}>{children}</TemplateVariableContext.Provider>;
}

interface TemplateVariableSrvArgs {
  initialVariableDefinitions?: VariableDefinition[];
  queryParams?: ReturnType<typeof useVariableQueryParams>;
}

function createTemplateVariableSrvStore({ initialVariableDefinitions = [], queryParams }: TemplateVariableSrvArgs) {
  const initialParams = getInitalValuesFromQueryParameters(queryParams ? queryParams[0] : {});
  const store = createStore<TemplateVariableStore>()(
    devtools(
      immer((set) => ({
        variableState: hydrateTemplateVariableStates(initialVariableDefinitions, initialParams),
        variableDefinitions: initialVariableDefinitions,
        setVariableDefinitions(definitions: VariableDefinition[]) {
          set((state) => {
            state.variableDefinitions = definitions;
            state.variableState = hydrateTemplateVariableStates(definitions, initialParams);
          });
        },
        setVariableOptions(name, options) {
          set((state) => {
            const varState = state.variableState[name];
            if (!varState) {
              return;
            }
            varState.options = options;
          });
        },
        setVariableLoading(name, loading) {
          set((state) => {
            const varState = state.variableState[name];
            if (!varState) {
              return;
            }
            varState.loading = loading;
          });
        },

        setVariableValue: (name, value) =>
          set((state) => {
            let val = value;
            const varState = state.variableState[name];
            if (!varState) {
              return;
            }

            // Make sure there is only one all value
            if (Array.isArray(val) && val.includes(ALL_VALUE)) {
              if (val.at(-1) === ALL_VALUE) {
                val = ALL_VALUE;
              } else {
                val = val.filter((v) => v !== ALL_VALUE);
              }
            }
            if (queryParams) {
              const setQueryParams = queryParams[1];
              setQueryParams({ [getURLQueryParamName(name)]: val });
            }
            varState.value = val;
          }),
      }))
    )
  );

  return store;
}

export interface TemplateVariableProviderProps {
  children: React.ReactNode;
  initialVariableDefinitions?: VariableDefinition[];
}

export function TemplateVariableProvider({ children, initialVariableDefinitions = [] }: TemplateVariableProviderProps) {
  const queryParams = useVariableQueryParams(initialVariableDefinitions);
  const [store] = useState(createTemplateVariableSrvStore({ initialVariableDefinitions, queryParams }));

  return (
    <TemplateVariableStoreContext.Provider value={store}>
      <PluginProvider>{children}</PluginProvider>
    </TemplateVariableStoreContext.Provider>
  );
}
