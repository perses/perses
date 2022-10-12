// Copyright 2022 The Perses Authors
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
}

function createTemplateVariableSrvStore({ initialVariableDefinitions = [] }: TemplateVariableSrvArgs) {
  const store = createStore<TemplateVariableStore>()(
    devtools(
      immer((set) => ({
        variableState: hydrateTemplateVariableStates(initialVariableDefinitions),
        variableDefinitions: initialVariableDefinitions,
        setVariableDefinitions(definitions: VariableDefinition[]) {
          set((state) => {
            state.variableDefinitions = definitions;
            state.variableState = hydrateTemplateVariableStates(definitions);
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
            varState.value = val;
          }),
      }))
    )
  );

  return store;
}

export function TemplateVariableProvider({
  children,
  initialVariableDefinitions = [],
}: {
  children: React.ReactNode;
  initialVariableDefinitions?: VariableDefinition[];
}) {
  const [store] = useState(createTemplateVariableSrvStore({ initialVariableDefinitions }));

  return (
    <TemplateVariableStoreContext.Provider value={store}>
      <PluginProvider>{children}</PluginProvider>
    </TemplateVariableStoreContext.Provider>
  );
}

/** Helpers */

function hydrateTemplateVariableState(definition: VariableDefinition) {
  const v = definition;
  const varState: VariableState = {
    value: v.spec.default_value ?? null,
    loading: false,
  };
  switch (v.kind) {
    case 'TextVariable':
      varState.value = v.spec.value;
      break;
    case 'ListVariable':
      varState.options = [];
      if (varState.options.length > 0 && !varState.value) {
        const firstOptionValue = varState.options[0]?.value ?? null;
        if (firstOptionValue !== null) {
          varState.value = v.spec.allow_multiple ? [firstOptionValue] : firstOptionValue;
        }
      }
      break;
    default:
      break;
  }
  return varState;
}

function hydrateTemplateVariableStates(definitions: VariableDefinition[]): VariableStateMap {
  const state: VariableStateMap = {};
  definitions.forEach((v) => {
    state[v.spec.name] = hydrateTemplateVariableState(v);
  });
  return state;
}
