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

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { createStore, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import produce from 'immer';
import {
  TemplateVariableContext,
  VariableStateMap,
  VariableState,
  VariableStoreStateMap,
  VariableOption,
  BuiltinVariableContext,
  useTimeRange,
} from '@perses-dev/plugin-system';
import {
  DEFAULT_ALL_VALUE as ALL_VALUE,
  VariableName,
  VariableValue,
  VariableDefinition,
  formatDuration,
  intervalToPrometheusDuration,
  BuiltinVariableDefinition,
} from '@perses-dev/core';
import { checkSavedDefaultVariableStatus, findVariableDefinitionByName, mergeVariableDefinitions } from './utils';
import { hydrateTemplateVariableStates } from './hydrationUtils';
import { getInitalValuesFromQueryParameters, getURLQueryParamName, useVariableQueryParams } from './query-params';

type TemplateVariableStore = {
  variableDefinitions: VariableDefinition[];
  externalVariableDefinitions: ExternalVariableDefinition[];
  variableState: VariableStoreStateMap;
  setVariableValue: (variableName: VariableName, value: VariableValue, source?: string) => void;
  setVariableOptions: (name: VariableName, options: VariableOption[], source?: string) => void;
  setVariableLoading: (name: VariableName, loading: boolean, source?: string) => void;
  setVariableDefinitions: (definitions: VariableDefinition[]) => void;
  setVariableDefaultValues: () => VariableDefinition[];
  getSavedVariablesStatus: () => { isSavedVariableModified: boolean; modifiedVariableNames: string[] };
};

const TemplateVariableStoreContext = createContext<ReturnType<typeof createTemplateVariableSrvStore> | undefined>(
  undefined
);
export function useTemplateVariableStoreCtx() {
  const context = useContext(TemplateVariableStoreContext);
  if (!context) {
    throw new Error('TemplateVariableStoreContext not initialized');
  }
  return context;
}

export function useTemplateVariableValues(variableNames?: string[]) {
  const store = useTemplateVariableStoreCtx();
  return useStore(
    store,
    (s) => {
      const vars: VariableStateMap = {};

      // Collect values of local variables, from the variable state
      const names = variableNames ?? s.variableDefinitions.map((value) => value.spec.name);
      names.forEach((name) => {
        const varState = s.variableState.get({ name });
        if (!varState || varState.overridden) {
          return;
        }
        vars[name] = varState;
      });

      // Collect values of external variables, from the variable state
      s.externalVariableDefinitions.forEach((d) => {
        const source = d.source;
        d.definitions.forEach((value) => {
          const name = value.spec.name;
          const varState = s.variableState.get({ name, source });
          if (!varState || varState.overridden) {
            return;
          }
          vars[name] = varState;
        });
      });

      return vars;
    },
    (left, right) => {
      return JSON.stringify(left) === JSON.stringify(right);
    }
  );
}

/**
 * Get the state and definition of a variable from the Template variables context.
 * @param name name of the variable
 * @param source if given, it searches in the external variables
 */
export function useTemplateVariable(name: string, source?: string) {
  const store = useTemplateVariableStoreCtx();
  return useStore(store, (s) => {
    const state = s.variableState.get({ name, source });
    const definitions = source
      ? s.externalVariableDefinitions.find((v) => v.source === source)?.definitions
      : s.variableDefinitions;
    const definition = (definitions || []).find((v) => v.spec.name === name);

    return { state, definition };
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
      setVariableDefaultValues: s.setVariableDefaultValues,
      getSavedVariablesStatus: s.getSavedVariablesStatus,
    };
  });
}

export function useTemplateVariableDefinitions() {
  const store = useTemplateVariableStoreCtx();
  return useStore(store, (s) => s.variableDefinitions);
}

export function useTemplateExternalVariableDefinitions() {
  const store = useTemplateVariableStoreCtx();
  return useStore(store, (s) => s.externalVariableDefinitions);
}

export function useTemplateVariableStore() {
  const store = useTemplateVariableStoreCtx();
  return useStore(store);
}

interface PluginProviderProps {
  children: ReactNode;
  builtinVariables?: BuiltinVariableDefinition[];
}

function PluginProvider({ children, builtinVariables }: PluginProviderProps) {
  const originalValues = useTemplateVariableValues();
  const definitions = useTemplateVariableDefinitions();
  const externalDefinitions = useTemplateExternalVariableDefinitions();
  const { absoluteTimeRange } = useTimeRange();

  const values = useMemo(() => {
    const contextValues: VariableStateMap = {};

    // This will loop through all the current variables values
    // and update any variables that have ALL_VALUE as their current value
    // to include all options.
    Object.keys(originalValues).forEach((name) => {
      const v = { ...originalValues[name] } as VariableState;

      if (v.value === ALL_VALUE) {
        const definition = findVariableDefinitionByName(name, definitions, externalDefinitions);
        // If the variable is a list variable and has a custom all value, then use that value instead
        if (definition?.kind === 'ListVariable' && definition.spec.customAllValue) {
          v.value = definition.spec.customAllValue;
        } else {
          v.value = v.options?.map((o: { value: string }) => o.value) ?? null;
        }
      }
      contextValues[name] = v;
    });
    return contextValues;
  }, [originalValues, definitions, externalDefinitions]);

  const allBuiltinVariables: BuiltinVariableDefinition[] = [
    {
      kind: 'BuiltinVariable',
      spec: {
        name: '__from',
        value: () => absoluteTimeRange.start.valueOf().toString(),
        source: 'Dashboard',
        display: {
          name: '__from',
          description: 'Start time of the current time range in unix millisecond epoch',
          hidden: true,
        },
      },
    },
    {
      kind: 'BuiltinVariable',
      spec: {
        name: '__to',
        value: () => absoluteTimeRange.end.valueOf().toString(),
        source: 'Dashboard',
        display: {
          name: '__to',
          description: 'End time of the current time range in unix millisecond epoch',
          hidden: true,
        },
      },
    },
    {
      kind: 'BuiltinVariable',
      spec: {
        name: '__range',
        value: () => formatDuration(intervalToPrometheusDuration(absoluteTimeRange)),
        source: 'Dashboard',
        display: {
          name: '__range',
          description: 'The range for the current dashboard in human readable format',
          hidden: true,
        },
      },
    },
    {
      kind: 'BuiltinVariable',
      spec: {
        name: '__range_s',
        value: () => ((absoluteTimeRange.end.valueOf() - absoluteTimeRange.start.valueOf()) / 1000).toString(),
        source: 'Dashboard',
        display: {
          name: '__range_s',
          description: 'The range for the current dashboard in second',
          hidden: true,
        },
      },
    },
    {
      kind: 'BuiltinVariable',
      spec: {
        name: '__range_ms',
        value: () => (absoluteTimeRange.end.valueOf() - absoluteTimeRange.start.valueOf()).toString(),
        source: 'Dashboard',
        display: {
          name: '__range_ms',
          description: 'The range for the current dashboard in millisecond',
          hidden: true,
        },
      },
    },
  ];
  builtinVariables?.forEach((def) => allBuiltinVariables.push(def));

  return (
    <BuiltinVariableContext.Provider value={{ variables: allBuiltinVariables }}>
      <TemplateVariableContext.Provider value={{ state: values }}>{children}</TemplateVariableContext.Provider>
    </BuiltinVariableContext.Provider>
  );
}

interface TemplateVariableSrvArgs {
  initialVariableDefinitions?: VariableDefinition[];
  externalVariableDefinitions?: ExternalVariableDefinition[];
  queryParams?: ReturnType<typeof useVariableQueryParams>;
}

function createTemplateVariableSrvStore({
  initialVariableDefinitions = [],
  externalVariableDefinitions = [],
  queryParams,
}: TemplateVariableSrvArgs) {
  const initialParams = getInitalValuesFromQueryParameters(queryParams ? queryParams[0] : {});
  const store = createStore<TemplateVariableStore>()(
    devtools(
      immer((set, get) => ({
        variableState: hydrateTemplateVariableStates(
          initialVariableDefinitions,
          initialParams,
          externalVariableDefinitions
        ),
        variableDefinitions: initialVariableDefinitions,
        externalVariableDefinitions: externalVariableDefinitions,
        setVariableDefinitions(definitions: VariableDefinition[]) {
          set(
            (state) => {
              state.variableDefinitions = definitions;
              state.variableState = hydrateTemplateVariableStates(
                definitions,
                initialParams,
                externalVariableDefinitions
              );
            },
            false,
            '[Variables] setVariableDefinitions' // Used for action name in Redux devtools
          );
        },
        setVariableOptions(name, options, source?: string) {
          set(
            (state) => {
              const varState = state.variableState.get({ name, source });
              if (!varState) {
                return;
              }
              varState.options = options;
            },
            false,
            '[Variables] setVariableOptions'
          );
        },
        setVariableLoading(name, loading, source?: string) {
          set(
            (state) => {
              const varState = state.variableState.get({ name, source });
              if (!varState) {
                return;
              }
              varState.loading = loading;
            },
            false,
            '[Variables] setVariableLoading'
          );
        },
        setVariableValue: (name, value, source?: string) =>
          set(
            (state) => {
              let val = value;
              const varState = state.variableState.get({ name, source });
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
            },
            false,
            '[Variables] setVariableValue'
          ),
        setVariableDefaultValues: () => {
          const variableDefinitions = get().variableDefinitions;
          const variableState = get().variableState;
          const updatedVariables = produce(variableDefinitions, (draft) => {
            draft.forEach((variable, index) => {
              const name = variable.spec.name;
              if (variable.kind === 'ListVariable') {
                const currentVariable = variableState.get({ name });
                if (currentVariable?.value !== undefined) {
                  draft[index] = {
                    kind: 'ListVariable',
                    spec: produce(variable.spec, (specDraft) => {
                      specDraft.defaultValue = currentVariable.value;
                    }),
                  };
                }
              } else if (variable.kind === 'TextVariable') {
                const currentVariable = variableState.get({ name });
                const currentVariableValue = typeof currentVariable?.value === 'string' ? currentVariable.value : '';
                if (currentVariable?.value !== undefined) {
                  draft[index] = {
                    kind: 'TextVariable',
                    spec: produce(variable.spec, (specDraft) => {
                      specDraft.value = currentVariableValue;
                    }),
                  };
                }
              }
            });
          });
          set(
            (state) => {
              state.variableDefinitions = updatedVariables;
            },
            false,
            '[Variables] setVariableDefaultValues'
          );
          return updatedVariables;
        },
        getSavedVariablesStatus: () => {
          return checkSavedDefaultVariableStatus(get().variableDefinitions, get().variableState);
        },
      }))
    )
  );

  return store;
}

export type ExternalVariableDefinition = {
  source: string;
  tooltip?: {
    title?: string;
    description?: string;
  };
  editLink?: string;
  definitions: VariableDefinition[];
};

export interface TemplateVariableProviderProps {
  children: ReactNode;
  initialVariableDefinitions?: VariableDefinition[];
  /**
   * The external variables allow you to give to the provider some additional variables, not defined in the dashboard and static.
   * It means that you won´t be able to update them from the dashboard itself, but you will see them appear and will be able
   * to modify their runtime value as any other variable.
   * If one of the external variable has the same name as a local one, it will be marked as overridden.
   * You can define one list of variable definition by source and as many source as you want.
   * The order of the sources is important as first one will take precedence on the following ones, in case they have same names.
   */
  externalVariableDefinitions?: ExternalVariableDefinition[];
  builtinVariables?: BuiltinVariableDefinition[];
}

export function TemplateVariableProvider({
  children,
  initialVariableDefinitions = [],
  externalVariableDefinitions = [],
  builtinVariables = [],
}: TemplateVariableProviderProps) {
  const allVariableDefs = mergeVariableDefinitions(initialVariableDefinitions, externalVariableDefinitions);
  const queryParams = useVariableQueryParams(allVariableDefs);
  const [store] = useState(
    createTemplateVariableSrvStore({ initialVariableDefinitions, externalVariableDefinitions, queryParams })
  );

  return (
    <TemplateVariableStoreContext.Provider value={store}>
      <PluginProvider builtinVariables={builtinVariables}>{children}</PluginProvider>
    </TemplateVariableStoreContext.Provider>
  );
}
