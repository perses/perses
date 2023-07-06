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

import { useEffect, useMemo, useState } from 'react';
import { Select, FormControl, InputLabel, MenuItem, Box, LinearProgress, TextField } from '@mui/material';
import {
  DEFAULT_ALL_VALUE,
  ListVariableDefinition,
  ListVariableSpec,
  UnknownSpec,
  VariableName,
  VariableValue,
} from '@perses-dev/core';
import { useListVariablePluginValues, VariableOption, VariableState } from '@perses-dev/plugin-system';
import { UseQueryResult } from '@tanstack/react-query';
import { useTemplateVariable, useTemplateVariableActions } from '../../context';

type TemplateVariableProps = {
  name: VariableName;
  source?: string;
};

export function TemplateVariable({ name, source }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name, source);
  const kind = ctx.definition?.kind;
  switch (kind) {
    case 'TextVariable':
      return <TextVariable name={name} source={source} />;
    case 'ListVariable':
      return <ListVariable name={name} source={source} />;
  }

  return <div>Unsupported Variable Kind: ${kind}</div>;
}

export function useListVariableState(
  spec: ListVariableSpec<UnknownSpec> | undefined,
  state: VariableState | undefined,
  variablesOptionsQuery: Partial<UseQueryResult<VariableOption[]>>
): {
  // Value, Loading, Options are modified only when we want to save the changes made
  value: VariableValue | undefined;
  loading: boolean;
  options: VariableOption[] | undefined;
  // selectedValue is the value(s) that will be used in the view only
  selectedValue: VariableValue;
  // viewOptions are the options used in the view only (options + All if allowed)
  viewOptions: VariableOption[];
} {
  const allowMultiple = spec?.allowMultiple === true;
  const allowAllValue = spec?.allowAllvalue === true;
  const loading = useMemo(() => variablesOptionsQuery.isFetching || false, [variablesOptionsQuery]);
  const options = variablesOptionsQuery.data;

  let value = state?.value;

  // Make sure value is an array if allowMultiple is true
  if (allowMultiple && !Array.isArray(value)) {
    value = typeof value === 'string' ? [value] : [];
  }

  const viewOptions = useMemo(() => {
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
        viewOptions.find((v) => {
          if (allowMultiple) {
            return (value as string[]).includes(v.value);
          }
          return value === v.value;
        })
      ),
    [viewOptions, value, allowMultiple]
  );

  value = useMemo(() => {
    const firstOptionValue = viewOptions?.[allowAllValue ? 1 : 0]?.value;

    // If there is no value but there are options, or the value is not in options, we set the value to the first option.
    if (firstOptionValue) {
      if (!valueIsInOptions || !value || value.length === 0) {
        return allowMultiple ? [firstOptionValue] : firstOptionValue;
      }
    }

    return value;
  }, [viewOptions, value, valueIsInOptions, allowMultiple, allowAllValue]);

  // Once we computed value, we set it as the selected one, if it is available in the options
  const selectedValue = value && valueIsInOptions ? value : allowMultiple ? [] : '';

  return { value, loading, options, selectedValue, viewOptions };
}

function ListVariable({ name, source }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name, source);
  const definition = ctx.definition as ListVariableDefinition;
  const variablesOptionsQuery = useListVariablePluginValues(definition);
  const { setVariableValue, setVariableLoading, setVariableOptions } = useTemplateVariableActions();
  const { selectedValue, value, loading, options, viewOptions } = useListVariableState(
    definition?.spec,
    ctx.state,
    variablesOptionsQuery
  );

  const title = definition?.spec.display?.name ?? name;
  const allowMultiple = definition?.spec.allow_multiple === true;
  const allowAllValue = definition?.spec.allow_all_value === true;

  // Update value when changed
  useEffect(() => {
    if (value) {
      setVariableValue(name, value, source);
    }
  }, [setVariableValue, name, value, source]);

  // Update loading when changed
  useEffect(() => {
    setVariableLoading(name, loading, source);
  }, [setVariableLoading, name, loading, source]);

  // Update options when changed
  useEffect(() => {
    if (options) {
      setVariableOptions(name, options, source);
    }
  }, [setVariableOptions, name, options, source]);

  return (
    <Box display={'flex'}>
      <FormControl fullWidth>
        <InputLabel id={name}>{title}</InputLabel>
        <Select
          sx={{ minWidth: 100, maxWidth: 250 }}
          id={name}
          label={title}
          value={selectedValue}
          onChange={(e) => {
            // Must be selected
            if (e.target.value === null || e.target.value.length === 0) {
              if (allowAllValue) {
                setVariableValue(name, DEFAULT_ALL_VALUE, source);
              }
              return;
            }
            setVariableValue(name, e.target.value as VariableValue, source);
          }}
          multiple={allowMultiple}
        >
          {loading && (
            <MenuItem value="loading" disabled>
              Loading
            </MenuItem>
          )}

          {viewOptions.length === 0 && (
            <MenuItem value="empty" disabled>
              No options
            </MenuItem>
          )}
          {viewOptions.map((option) => (
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

function TextVariable({ name, source }: TemplateVariableProps) {
  const { state, definition } = useTemplateVariable(name, source);
  const [tempValue, setTempValue] = useState(state?.value ?? '');
  const { setVariableValue } = useTemplateVariableActions();

  useEffect(() => {
    setTempValue(state?.value ?? '');
  }, [state?.value]);

  return (
    <TextField
      value={tempValue}
      onChange={(e) => setTempValue(e.target.value)}
      onBlur={() => setVariableValue(name, tempValue, source)}
      placeholder={name}
      label={definition?.spec.display?.name ?? name}
    />
  );
}
