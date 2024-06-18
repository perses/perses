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

import { createContext, useContext, useMemo } from 'react';
import { VariableValue } from '@perses-dev/core';
import { immerable } from 'immer';
import { VariableOption } from '../model';
import { parseVariables, replaceVariables } from '../utils';
import { useBuiltinVariableValues } from './builtin-variables';

export type VariableState = {
  value: VariableValue;
  options?: VariableOption[];
  loading: boolean;
  error?: Error;
  /**
   * If a local variable is overriding an external variable, local var will have the flag ``overriding=true``.
   */
  overriding?: boolean;
  /**
   * If a local variable is overriding an external variable, external var will have the flag ``overridden=true``.
   */
  overridden?: boolean;
  defaultValue?: VariableValue;
};

export type VariableStateMap = Record<string, VariableState>;

/**
 * Structure used as key in the {@link VariableStoreStateMap}.
 */
export type VariableStateKey = {
  /**
   * name of the variable we want to access in the state.
   */
  name: string;
  /**
   * source of the variable we want to access in the state.
   * Defined only for external variables.
   */
  source?: string;
};

/**
 * A state map with two entry keys, materialized by {@link VariableStateKey} structure.
 */
export class VariableStoreStateMap {
  /**
   * "Immerable" is mandatory to be able to use this class in an immer context.
   * Ref: https://docs.pmnd.rs/zustand/integrations/immer-middleware#gotchas
   */
  [immerable] = true;

  private readonly DEFAULT_LOCAL_SOURCE_NAME = '';
  private readonly _state: Record<string, Record<string, VariableState>> = {};

  /**
   * Get variable state by key.
   * @param key
   */
  get(key: VariableStateKey): VariableState | undefined {
    return this._sourceStatesOrEmpty(key.source)[key.name];
  }

  /**
   * Set variable state by key.
   * @param key
   * @param value
   */
  set(key: VariableStateKey, value: VariableState): VariableState | undefined {
    const sourceName = this._sourceName(key.source);
    if (!this._state[sourceName]) {
      this._state[sourceName] = {};
    }
    this._sourceStatesOrEmpty(key.source)[key.name] = value;
    return value;
  }

  /**
   * Check presence of variable state by key.
   * @param key
   */
  has(key: VariableStateKey): boolean {
    return this._sourceStatesOrEmpty(key.source)[key.name] !== undefined;
  }

  /**
   * Delete variable state by key.
   * @param key
   */
  delete(key: VariableStateKey): boolean {
    const result = this.has(key);
    const sourceName = this._sourceName(key.source);
    const sourceStates = this._state[sourceName];

    // Delete var from source state
    if (sourceStates) {
      delete sourceStates[key.name];
    }

    // Delete source state from state if empty
    if (Object.keys(sourceStates ?? {})?.length === 0) {
      delete this._state[sourceName];
    }
    return result;
  }

  private _sourceName(source: string | undefined): string {
    return source ?? this.DEFAULT_LOCAL_SOURCE_NAME;
  }

  private _sourceStatesOrEmpty(source: string | undefined): Record<string, VariableState> {
    return this._state[this._sourceName(source)] ?? {};
  }
}

export type VariableSrv = {
  state: VariableStateMap;
};

export const VariableContext = createContext<VariableSrv | undefined>(undefined);

function useVariableContext() {
  const ctx = useContext(VariableContext);
  if (ctx === undefined) {
    throw new Error('No VariableContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useVariableValues(names?: string[]): VariableStateMap {
  const { state } = useVariableContext();

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

// useAllVariableValues wraps user-defined variables with built-in variables
export function useAllVariableValues(names?: string[]): VariableStateMap {
  const variableValues = useVariableValues(names);
  const builtinVariableValues = useBuiltinVariableValues(names);

  return useMemo(() => {
    return { ...variableValues, ...builtinVariableValues } as VariableStateMap;
  }, [variableValues, builtinVariableValues]);
}

// Convenience hook for replacing variables in a string
export function useReplaceVariablesInString(str: string | undefined): string | undefined {
  const variablesInString = str ? parseVariables(str) : [];
  const variableValues = useAllVariableValues(variablesInString);
  if (!str) return undefined;
  return replaceVariables(str, variableValues);
}
