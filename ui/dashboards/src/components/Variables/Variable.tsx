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

import { useEffect, useMemo, useState } from 'react';
import { Select, FormControl, InputLabel, MenuItem, Box, LinearProgress, TextField } from '@mui/material';
import { VariableName, ListVariableDefinition, VariableValue } from '@perses-dev/core';
import {
  usePlugin,
  DEFAULT_ALL_VALUE,
  useTemplateVariableValues,
  VariableStateMap,
  useDatasourceStore,
} from '@perses-dev/plugin-system';
import { useQuery } from '@tanstack/react-query';
import { useTemplateVariable, useTemplateVariableActions } from '../../context';

type TemplateVariableProps = {
  name: VariableName;
};

export function TemplateVariable({ name }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name);
  const kind = ctx.definition?.kind;
  switch (kind) {
    case 'TextVariable':
      return <TextVariable name={name} />;
    case 'ListVariable':
      return <ListVariable name={name} />;
  }

  return <div>Unsupported Variable Kind: ${kind}</div>;
}

/**
 * Returns a serialized string of the current state of variable values.
 */
function getVariableValuesKey(v: VariableStateMap) {
  return Object.values(v)
    .map((v) => JSON.stringify(v.value))
    .join(',');
}

function ListVariable({ name }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name);
  const definition = ctx.definition as ListVariableDefinition;
  const { data: variablePlugin } = usePlugin('Variable', definition.spec.plugin.kind);
  const { setVariableValue, setVariableLoading, setVariableOptions } = useTemplateVariableActions();
  const datasourceStore = useDatasourceStore();

  const spec = definition.spec.plugin.spec;

  let dependsOnVariables: string[] | undefined;
  if (variablePlugin?.dependsOn) {
    dependsOnVariables = variablePlugin.dependsOn(spec);
  }

  const variables = useTemplateVariableValues(dependsOnVariables);
  const allowMultiple = definition?.spec.allow_multiple === true;
  const allowAllValue = definition?.spec.allow_all_value === true;
  const label = definition?.spec.display?.label ?? name;

  let waitToLoad = false;
  if (dependsOnVariables) {
    waitToLoad = dependsOnVariables.some((v) => variables[v]?.loading);
  }

  const variablesValueKey = getVariableValuesKey(variables);

  const variablesOptionsQuery = useQuery(
    [name, definition, variablesValueKey],
    async () => {
      const resp = await variablePlugin?.getVariableOptions(spec, { datasourceStore, variables });
      return resp?.data ?? [];
    },
    { enabled: !!variablePlugin || waitToLoad }
  );

  useEffect(() => {
    setVariableLoading(name, variablesOptionsQuery.isFetching);
    if (variablesOptionsQuery.data) {
      setVariableOptions(name, variablesOptionsQuery.data);
    }
  }, [variablesOptionsQuery, name, setVariableLoading, setVariableOptions]);

  let value = ctx.state?.value;
  const options = ctx.state?.options;
  const loading = ctx.state?.loading;

  // Make sure value is an array if allowMultiple is true
  if (allowMultiple && !Array.isArray(value)) {
    value = typeof value === 'string' ? [value] : [];
  }

  const finalOptions = useMemo(() => {
    let computedOptions = options ? [...options] : [];

    // Add the all value if it's allowed
    if (allowAllValue) {
      computedOptions = [{ value: DEFAULT_ALL_VALUE, label: 'All' }, ...computedOptions];
    }
    return computedOptions;
  }, [options, allowAllValue]);

  const valueIsInOptions = useMemo(
    () =>
      Boolean(
        finalOptions.find((v) => {
          if (allowMultiple) {
            return (value as string[]).includes(v.value);
          }
          return value === v.value;
        })
      ),
    [finalOptions, value, allowMultiple]
  );
  const selectValue = valueIsInOptions ? value ?? '' : '';

  useEffect(() => {
    const firstOption = finalOptions?.[0];

    // If there is no value but there are options, set the value to the first option.
    if (!value && firstOption) {
      setVariableValue(name, firstOption.value);
    }
  }, [finalOptions, setVariableValue, value, name, allowMultiple]);

  return (
    <Box display={'flex'}>
      <FormControl fullWidth>
        <InputLabel id={name}>{label}</InputLabel>
        <Select
          sx={{ minWidth: 100, maxWidth: 250 }}
          id={name}
          label={name}
          value={selectValue}
          onChange={(e) => {
            // Must be selected
            if (e.target.value === null || e.target.value.length === 0) {
              if (allowAllValue) {
                setVariableValue(name, DEFAULT_ALL_VALUE);
              }
              return;
            }
            setVariableValue(name, e.target.value as VariableValue);
          }}
          multiple={allowMultiple}
        >
          {loading && (
            <MenuItem value="loading" disabled>
              Loading
            </MenuItem>
          )}
          {finalOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {loading && <LinearProgress />}
      </FormControl>
    </Box>
  );
}

function TextVariable({ name }: TemplateVariableProps) {
  const { state } = useTemplateVariable(name);
  const [tempValue, setTempValue] = useState(state?.value ?? '');
  const { setVariableValue } = useTemplateVariableActions();

  useEffect(() => {
    setTempValue(state?.value ?? '');
  }, [state?.value]);

  return (
    <TextField
      value={tempValue}
      onChange={(e) => setTempValue(e.target.value)}
      onBlur={() => setVariableValue(name, tempValue)}
      placeholder={name}
      label={name}
    />
  );
}
