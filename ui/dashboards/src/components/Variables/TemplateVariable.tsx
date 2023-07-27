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
import { DEFAULT_ALL_VALUE, ListVariableDefinition, VariableName, VariableValue } from '@perses-dev/core';
import { useListVariablePluginValues } from '@perses-dev/plugin-system';
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

function ListVariable({ name, source }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name, source);
  const definition = ctx.definition as ListVariableDefinition;
  const variablesOptionsQuery = useListVariablePluginValues(definition);
  const { setVariableValue, setVariableLoading, setVariableOptions } = useTemplateVariableActions();

  const allowMultiple = definition?.spec.allow_multiple === true;
  const allowAllValue = definition?.spec.allow_all_value === true;
  const title = definition?.spec.display?.name ?? name;

  useEffect(() => {
    setVariableLoading(name, variablesOptionsQuery.isFetching, source);
    if (variablesOptionsQuery.data) {
      setVariableOptions(name, variablesOptionsQuery.data, source);
    }
  }, [variablesOptionsQuery, name, setVariableLoading, setVariableOptions, source]);

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

  let selectValue = value;
  if (!valueIsInOptions) {
    selectValue = allowMultiple ? [] : '';
  }

  useEffect(() => {
    const firstOption = finalOptions?.[0];

    // If there is no value but there are options, set the value to the first option.
    if (!value && firstOption) {
      setVariableValue(name, firstOption.value, source);
    }
  }, [finalOptions, setVariableValue, value, name, allowMultiple, source]);

  return (
    <Box display={'flex'}>
      <FormControl fullWidth>
        <InputLabel id={name}>{title}</InputLabel>
        <Select
          sx={{ minWidth: 100, maxWidth: 250 }}
          id={name}
          label={title}
          value={selectValue}
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

          {finalOptions.length === 0 && (
            <MenuItem value="empty" disabled>
              No options
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
