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

import { ListVariableDefinition, VariableDefinition } from '@perses-dev/core';
import {
  useDatasourceStore,
  usePlugin,
  useTemplateVariableValues,
  useTimeRange,
  VariableOption,
  VariableStateMap,
} from '@perses-dev/plugin-system';
import { useQuery } from '@tanstack/react-query';

export function filterVariableList(data: VariableOption[], capturedRegexp: RegExp): VariableOption[] {
  const result: VariableOption[] = [];
  const filteredSet = new Set<string>();
  for (const variableValue of data) {
    const matches = variableValue.value.matchAll(capturedRegexp);
    let concat = '';
    for (const match of matches) {
      for (let i = 1; i < match.length; i++) {
        const m = match[i];
        if (m !== undefined) {
          concat = `${concat}${m}`;
        }
      }
    }
    if (concat !== '' && !filteredSet.has(concat)) {
      // like that we are avoiding to have duplicating variable value
      filteredSet.add(concat);
      result.push({ label: variableValue.label, value: concat });
    }
  }
  return result;
}

export function useListVariablePluginValues(definition: ListVariableDefinition) {
  const { data: variablePlugin } = usePlugin('Variable', definition.spec.plugin.kind);
  const datasourceStore = useDatasourceStore();
  const allVariables = useTemplateVariableValues();
  const { absoluteTimeRange: timeRange, refreshKey } = useTimeRange();

  const variablePluginCtx = { timeRange, datasourceStore, variables: allVariables };

  const spec = definition.spec.plugin.spec;
  const capturingRegexp =
    definition.spec.capturing_regexp !== undefined ? new RegExp(definition.spec.capturing_regexp, 'g') : undefined;

  let dependsOnVariables: string[] | undefined;
  if (variablePlugin?.dependsOn) {
    const dependencies = variablePlugin.dependsOn(spec, variablePluginCtx);
    dependsOnVariables = dependencies.variables;
  }

  const variables = useTemplateVariableValues(dependsOnVariables);

  let waitToLoad = false;
  if (dependsOnVariables) {
    waitToLoad = dependsOnVariables.some((v) => variables[v]?.loading);
  }

  const variablesValueKey = getVariableValuesKey(variables);

  return useQuery(
    [name, definition, variablesValueKey, timeRange, refreshKey],
    async () => {
      const resp = await variablePlugin?.getVariableOptions(spec, { datasourceStore, variables, timeRange });
      if (resp === undefined) {
        return [];
      }
      if (capturingRegexp === undefined) {
        return resp.data;
      }
      return filterVariableList(resp.data, capturingRegexp);
    },
    { enabled: !!variablePlugin || waitToLoad }
  );
}

/**
 * Returns a serialized string of the current state of variable values.
 */
export function getVariableValuesKey(v: VariableStateMap) {
  return Object.values(v)
    .map((v) => JSON.stringify(v.value))
    .join(',');
}

export const VARIABLE_TYPES = [
  { label: 'List', kind: 'ListVariable' },
  { label: 'Text', kind: 'TextVariable' },
] as const;

/*
 * Check whether saved variable definitions are out of date with current default list values in Zustand store
 */
export function checkSavedVariablesStatus(definitions: VariableDefinition[], varState: VariableStateMap) {
  let isSavedVariablesOutdated = false;
  definitions.forEach((saveVariable) => {
    if (saveVariable.kind === 'ListVariable') {
      const currentVariable = varState[saveVariable.spec.name];
      if (saveVariable.spec.default_value !== currentVariable?.value) {
        isSavedVariablesOutdated = true;
      }
    } else if (saveVariable.kind === 'TextVariable') {
      const currentVariable = varState[saveVariable.spec.name];
      const currentVariableValue = typeof currentVariable?.value === 'string' ? currentVariable.value : '';
      if (saveVariable.spec.value !== currentVariableValue) {
        isSavedVariablesOutdated = true;
      }
    }
  });
  return isSavedVariablesOutdated;
}
