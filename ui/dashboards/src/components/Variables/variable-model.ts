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

import { ListVariableDefinition } from '@perses-dev/core';
import {
  usePlugin,
  useTemplateVariableValues,
  useDatasourceStore,
  useTimeRange,
  VariableStateMap,
} from '@perses-dev/plugin-system';
import { useQuery } from '@tanstack/react-query';

export function useListVariablePluginValues(definition: ListVariableDefinition) {
  const { data: variablePlugin } = usePlugin('Variable', definition.spec.plugin.kind);
  const datasourceStore = useDatasourceStore();
  const allVariables = useTemplateVariableValues();
  const { timeRange } = useTimeRange();

  const variablePluginCtx = { timeRange, datasourceStore, variables: allVariables };

  const spec = definition.spec.plugin.spec;

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

  const variablesOptionsQuery = useQuery(
    [name, definition, variablesValueKey, timeRange],
    async () => {
      const resp = await variablePlugin?.getVariableOptions(spec, { datasourceStore, variables, timeRange });
      return resp?.data ?? [];
    },
    { enabled: !!variablePlugin || waitToLoad }
  );

  return variablesOptionsQuery;
}

/**
 * Returns a serialized string of the current state of variable values.
 */
export function getVariableValuesKey(v: VariableStateMap) {
  return Object.values(v)
    .map((v) => JSON.stringify(v.value))
    .join(',');
}
