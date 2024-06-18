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

import { VariableDefinition } from '@perses-dev/core';
import { VariableStoreStateMap } from '@perses-dev/plugin-system';
import { ExternalVariableDefinition } from '@perses-dev/dashboards';

/*
 * Check whether saved variable definitions are out of date with current default list values in Zustand store
 */
export function checkSavedDefaultVariableStatus(definitions: VariableDefinition[], varState: VariableStoreStateMap) {
  let isSavedVariableModified = false;
  const modifiedVariableNames: string[] = [];
  for (const savedVariable of definitions) {
    const name = savedVariable.spec.name;
    if (savedVariable.kind === 'ListVariable') {
      const currentVariable = varState.get({ name });
      if (currentVariable?.value !== null && currentVariable?.value !== savedVariable.spec.defaultValue) {
        modifiedVariableNames.push(name);
        isSavedVariableModified = true;
      }
    } else if (savedVariable.kind === 'TextVariable') {
      const currentVariable = varState.get({ name });
      const currentVariableValue = typeof currentVariable?.value === 'string' ? currentVariable.value : '';
      if (savedVariable.spec.value !== currentVariableValue) {
        modifiedVariableNames.push(name);
        isSavedVariableModified = true;
      }
    }
  }
  return { isSavedVariableModified, modifiedVariableNames };
}

/**
 * Merge the different kind of variable definition into a list without any duplicates (same name).
 * Respects the order of priority explained in {@link forEachVariableDefinition}
 * @param locals
 * @param externals
 */
export function mergeVariableDefinitions(
  locals: VariableDefinition[],
  externals: ExternalVariableDefinition[]
): VariableDefinition[] {
  const pushed: Record<string, boolean> = {};
  const result: VariableDefinition[] = [];

  // Append the value only if it's not already appended
  forEachVariableDefinition(locals, externals, (value: VariableDefinition, name: string) => {
    if (!pushed[name]) {
      result.push(value);
      pushed[name] = true;
    }
  });
  return result;
}

/**
 * Find a definition by its name.
 * Respects the order of priority explained in {@link forEachVariableDefinition}
 * @param name
 * @param localDefinitions
 * @param externalDefinitions
 */
export function findVariableDefinitionByName(
  name: string,
  localDefinitions: VariableDefinition[],
  externalDefinitions: ExternalVariableDefinition[]
): VariableDefinition | undefined {
  return mergeVariableDefinitions(localDefinitions, externalDefinitions).find((d) => d.spec.name === name);
}

/**
 * Loop on local and external variable definitions, respecting the order of priority:
 * - local var defs override external var defs of same name
 * - each external var defs override the external var defs coming after.
 * @param locals
 * @param externals
 * @param callbackFn
 */
export function forEachVariableDefinition(
  locals: VariableDefinition[],
  externals: ExternalVariableDefinition[],
  callbackFn: (varDef: VariableDefinition, name: string, source?: string) => void
) {
  locals.forEach((v) => callbackFn(v, v.spec.name));
  externals.forEach((ext) => ext.definitions.forEach((v) => callbackFn(v, v.spec.name, ext.source)));
}
