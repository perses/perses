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

import { ListVariableDefinition } from '@perses-dev/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { VariableOption } from '../../model';
import { useDatasourceStore, usePlugin, useTimeRange, useAllVariableValues, VariableStateMap } from '../../runtime';

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

export function useListVariablePluginValues(definition: ListVariableDefinition): UseQueryResult<VariableOption[]> {
  const { data: variablePlugin } = usePlugin('Variable', definition.spec.plugin.kind);
  const datasourceStore = useDatasourceStore();
  const allVariables = useAllVariableValues();
  const { absoluteTimeRange: timeRange, refreshKey } = useTimeRange();

  const variablePluginCtx = { timeRange, datasourceStore, variables: allVariables };

  const spec = definition.spec.plugin.spec;
  const capturingRegexp =
    definition.spec.capturingRegexp !== undefined ? new RegExp(definition.spec.capturingRegexp, 'g') : undefined;

  let dependsOnVariables: string[] | undefined;
  if (variablePlugin?.dependsOn) {
    const dependencies = variablePlugin.dependsOn(spec, variablePluginCtx);
    dependsOnVariables = dependencies.variables;
  }

  const variables = useAllVariableValues(dependsOnVariables);

  let waitToLoad = false;
  if (dependsOnVariables) {
    waitToLoad = dependsOnVariables.some((v) => variables[v]?.loading);
  }

  const variablesValueKey = getVariableValuesKey(variables);

  return useQuery({
    queryKey: [definition, variablesValueKey, timeRange, refreshKey],
    queryFn: async () => {
      const resp = await variablePlugin?.getVariableOptions(spec, { datasourceStore, variables, timeRange });
      if (resp === undefined) {
        return [];
      }
      if (!capturingRegexp) {
        return resp.data;
      }
      return filterVariableList(resp.data, capturingRegexp);
    },
    enabled: !!variablePlugin || waitToLoad,
  });
}

/**
 * Returns a serialized string of the current state of variable values.
 */
export function getVariableValuesKey(v: VariableStateMap): string {
  return Object.values(v)
    .map((v) => JSON.stringify(v.value))
    .join(',');
}

export const VARIABLE_TYPES = [
  { label: 'List', kind: 'ListVariable' },
  { label: 'Text', kind: 'TextVariable' },
] as const;
