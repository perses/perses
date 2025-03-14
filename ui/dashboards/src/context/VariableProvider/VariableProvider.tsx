// Copyright 2024 The Perses Authors
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

import { createContext, ReactElement, ReactNode, useContext, useMemo, useState } from 'react';
import { createStore, StoreApi, useStore } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { produce } from 'immer';
import {
  VariableContext,
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
  TextVariableDefinition,
  ListVariableDefinition,
} from '@perses-dev/core';
import { checkSavedDefaultVariableStatus, findVariableDefinitionByName, mergeVariableDefinitions } from './utils';
import { hydrateVariableDefinitionStates as hydrateVariableDefinitionStates } from './hydrationUtils';
import { getInitalValuesFromQueryParameters, getURLQueryParamName, useVariableQueryParams } from './query-params';

/**
 * This store is used to manipulate and read the definition of the variables and their state.
 * - being local or external variables.
 * - being text or list variables.
 * - being of any state (value, options, loading, error, ...) check {@VariableState}
 * Go and read each property documentation for more details.
 */
type VariableDefinitionStore = {
  /**
   * List of local variables definitions.
   * This is typically the variable definition that can be modified through the setVariableDefinition setter.
   *
   * In Perses App ecosystem, this is typically the dashboard scope variables, that's why we call them local.
   * Note that depending on the form, we can reuse this store to modify higher scope variables. For example,
   * when we modify the variable of a project, we'll set this field with project scope variables. To be able to modify
   * them.
   */
  variableDefinitions: VariableDefinition[];
  /**
   * List of external variable definitions.
   * This is static variable definitions that won´t be modified under this context.
   * You'll have to set one list of external variable definition by scope. See {@link ExternalVariableDefinition} for
   * more details.
   *
   * In Perses App ecosystem, this is typically the project or global scope variables.
   * Note that depending on the form, we can reuse this store to modify higher scope variables. For example,
   * when we modify the variable of a project, we'll set this field with global scope variables. Which means we
   * won't be able to modify them from this form.
   */
  externalVariableDefinitions: ExternalVariableDefinition[];
  /**
   * Additionally to definitions, we need to associate to each variable a state. That's what this map is meant for.
   * This can be heavily modified under this context, using the different setters available.
   * Note that the state of local AND external variables can be modified.
   */
  variableState: VariableStoreStateMap;
  /**
   * Allow to modify the `value` property of a variable in the state map.
   * @param variableName identify the variable
   * @param value new value
   * @param source identify the variable source if this is an external variable. See {@link ExternalVariableDefinition}
   */
  setVariableValue: (variableName: VariableName, value: VariableValue, source?: string) => void;
  /**
   * Allow to modify the `options` property of a variable in the state map.
   * @param variableName identify the variable
   * @param options new value
   * @param source identify the variable source if this is an external variable. See {@link ExternalVariableDefinition}
   */
  setVariableOptions: (name: VariableName, options: VariableOption[], source?: string) => void;
  /**
   * Allow to modify the `loading` property of a variable in the state map.
   * @param variableName identify the variable
   * @param laoding new value
   * @param source identify the variable source if this is an external variable. See {@link ExternalVariableDefinition}
   */
  setVariableLoading: (name: VariableName, loading: boolean, source?: string) => void;
  setVariableDefinitions: (definitions: VariableDefinition[]) => void;
  setVariableDefaultValues: () => VariableDefinition[];
  getSavedVariablesStatus: () => { isSavedVariableModified: boolean; modifiedVariableNames: string[] };
};

/**
 * Context object for {@link VariableDefinitionStore}.
 */
const VariableDefinitionStoreContext = createContext<StoreApi<VariableDefinitionStore> | undefined>(undefined);
export function useVariableDefinitionStoreCtx(): StoreApi<VariableDefinitionStore> {
  const context = useContext(VariableDefinitionStoreContext);
  if (!context) {
    throw new Error('VariableStoreContext not initialized');
  }
  return context;
}

export function useVariableDefinitionStates(variableNames?: string[]): VariableStateMap {
  const store = useVariableDefinitionStoreCtx();
  return useStoreWithEqualityFn(
    store,
    (s) => {
      const varStates: VariableStateMap = {};

      // Collect values of local variables, from the variable state
      const names = variableNames ?? s.variableDefinitions.map((value) => value.spec.name);
      names.forEach((name) => {
        const varState = s.variableState.get({ name });
        if (!varState || varState.overridden) {
          return;
        }
        varStates[name] = varState;
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
          varStates[name] = varState;
        });
      });

      return varStates;
    },
    (left, right) => {
      return JSON.stringify(left) === JSON.stringify(right);
    }
  );
}

/**
 * Get the state and definition of a variable from the variables context.
 * @param name name of the variable
 * @param source if given, it searches in the external variables
 */
export function useVariableDefinitionAndState(
  name: string,
  source?: string
): {
  definition: TextVariableDefinition | ListVariableDefinition | undefined;
  state: VariableState | undefined;
} {
  const store = useVariableDefinitionStoreCtx();
  return useStore(store, (s) => {
    const state = s.variableState.get({ name, source });
    const definitions = source
      ? s.externalVariableDefinitions.find((v) => v.source === source)?.definitions
      : s.variableDefinitions;
    const definition = (definitions || []).find((v) => v.spec.name === name);

    return { state, definition };
  });
}

export function useVariableDefinitionActions(): {
  setVariableLoading: (name: VariableName, loading: boolean, source?: string) => void;
  getSavedVariablesStatus: () => { isSavedVariableModified: boolean; modifiedVariableNames: string[] };
  setVariableDefaultValues: () => VariableDefinition[];
  setVariableValue: (variableName: VariableName, value: VariableValue, source?: string) => void;
  setVariableOptions: (name: VariableName, options: VariableOption[], source?: string) => void;
  setVariableDefinitions: (definitions: VariableDefinition[]) => void;
} {
  const store = useVariableDefinitionStoreCtx();
  return useStoreWithEqualityFn(
    store,
    (s) => {
      return {
        setVariableValue: s.setVariableValue,
        setVariableLoading: s.setVariableLoading,
        setVariableOptions: s.setVariableOptions,
        setVariableDefinitions: s.setVariableDefinitions,
        setVariableDefaultValues: s.setVariableDefaultValues,
        getSavedVariablesStatus: s.getSavedVariablesStatus,
      };
    },
    shallow
  );
}

export function useVariableDefinitions(): VariableDefinition[] {
  const store = useVariableDefinitionStoreCtx();
  return useStore(store, (s) => s.variableDefinitions);
}

export function useExternalVariableDefinitions(): ExternalVariableDefinition[] {
  const store = useVariableDefinitionStoreCtx();
  return useStore(store, (s) => s.externalVariableDefinitions);
}

interface PluginProviderProps {
  children: ReactNode;
  builtinVariables?: BuiltinVariableDefinition[];
}

function PluginProvider({ children, builtinVariables }: PluginProviderProps): ReactElement {
  const originalValues = useVariableDefinitionStates();
  const definitions = useVariableDefinitions();
  const externalDefinitions = useExternalVariableDefinitions();
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

  const allBuiltinVariables: BuiltinVariableDefinition[] = useMemo(() => {
    const result: BuiltinVariableDefinition[] = [
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
    builtinVariables?.forEach((def) => result.push(def));
    return result;
  }, [absoluteTimeRange, builtinVariables]);

  return (
    <BuiltinVariableContext.Provider value={{ variables: allBuiltinVariables }}>
      <VariableContext.Provider value={{ state: values }}>{children}</VariableContext.Provider>
    </BuiltinVariableContext.Provider>
  );
}

interface VariableDefinitionStoreArgs {
  initialVariableDefinitions?: VariableDefinition[];
  externalVariableDefinitions?: ExternalVariableDefinition[];
  queryParams?: ReturnType<typeof useVariableQueryParams>;
}

function createVariableDefinitionStore({
  initialVariableDefinitions = [],
  externalVariableDefinitions = [],
  queryParams,
}: VariableDefinitionStoreArgs): StoreApi<VariableDefinitionStore> {
  const initialParams = getInitalValuesFromQueryParameters(queryParams ? queryParams[0] : {});
  const store = createStore<VariableDefinitionStore>()(
    devtools(
      immer((set, get) => ({
        variableState: hydrateVariableDefinitionStates(
          initialVariableDefinitions,
          initialParams,
          externalVariableDefinitions
        ),
        variableDefinitions: initialVariableDefinitions,
        externalVariableDefinitions: externalVariableDefinitions,
        setVariableDefinitions(definitions: VariableDefinition[]): void {
          set(
            (state) => {
              state.variableDefinitions = definitions;
              state.variableState = hydrateVariableDefinitionStates(
                definitions,
                initialParams,
                externalVariableDefinitions
              );
            },
            false,
            '[Variables] setVariableDefinitions' // Used for action name in Redux devtools
          );
        },
        setVariableOptions(name, options, source?: string): void {
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
        setVariableLoading(name, loading, source?: string): void {
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
        setVariableValue: (name, value, source?: string): void =>
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
        setVariableDefaultValues: (): VariableDefinition[] => {
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
        getSavedVariablesStatus: (): {
          modifiedVariableNames: string[];
          isSavedVariableModified: boolean;
        } => {
          return checkSavedDefaultVariableStatus(get().variableDefinitions, get().variableState);
        },
      }))
    )
  );

  return store as unknown as StoreApi<VariableDefinitionStore>; // TODO: @Gladorme check if we can avoid this cast
}

/**
 * The external variables allow you to give to the provider some additional variables, not defined in the dashboard and static.
 * It means that you won´t be able to update them from the dashboard itself, but you will see them appear and will be able
 * to modify their runtime value as any other variable.
 * If one of the external variable has the same name as a local one, it will be marked as overridden.
 * You can define one list of variable definition by source and as many source as you want.
 * The order of the sources is important as first one will take precedence on the following ones, in case they have same names.
 */
export type ExternalVariableDefinition = {
  source: string;
  tooltip?: {
    title?: string;
    description?: string;
  };
  editLink?: string;
  definitions: VariableDefinition[];
};

export interface VariableProviderProps {
  children: ReactNode;
  initialVariableDefinitions?: VariableDefinition[];
  externalVariableDefinitions?: ExternalVariableDefinition[];
  builtinVariableDefinitions?: BuiltinVariableDefinition[];
}

// TODO: merge the different providers related to Variables under a single one (and keep "VariableProvider" as a name)
export function VariableProvider({
  children,
  initialVariableDefinitions = [],
  externalVariableDefinitions = [],
  builtinVariableDefinitions = [],
}: VariableProviderProps): ReactElement {
  const [store] = useState(() =>
    createVariableDefinitionStore({ initialVariableDefinitions, externalVariableDefinitions })
  );

  return (
    <VariableDefinitionStoreContext.Provider value={store}>
      <PluginProvider builtinVariables={builtinVariableDefinitions}>{children}</PluginProvider>
    </VariableDefinitionStoreContext.Provider>
  );
}

export function VariableProviderWithQueryParams({
  children,
  initialVariableDefinitions = [],
  externalVariableDefinitions = [],
  builtinVariableDefinitions: builtinVariables = [],
}: VariableProviderProps): ReactElement {
  const allVariableDefs = mergeVariableDefinitions(initialVariableDefinitions, externalVariableDefinitions);
  const queryParams = useVariableQueryParams(allVariableDefs);
  const [store] = useState(() =>
    createVariableDefinitionStore({ initialVariableDefinitions, externalVariableDefinitions, queryParams })
  );

  return (
    <VariableDefinitionStoreContext.Provider value={store}>
      <PluginProvider builtinVariables={builtinVariables}>{children}</PluginProvider>
    </VariableDefinitionStoreContext.Provider>
  );
}
