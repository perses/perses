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

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { Select, FormControl, InputLabel, MenuItem, Box, LinearProgress, TextField } from '@mui/material';
import { VariableName, ListVariableDefinition, DEFAULT_ALL_VALUE, VariableValue } from '@perses-dev/core';
import { useVariablePlugin } from '@perses-dev/plugin-system';
import { useTemplateVariable, useTemplateVariableActions, useTemplateVariableStore } from '../../context';

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

function ListVariable({ name }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name);
  const definition = ctx.definition as ListVariableDefinition;
  const variablePlugin = useVariablePlugin(definition);

  const { setVariableValue, setVariableLoading, setVariableOptions } = useTemplateVariableActions();
  const allowMultiple = definition?.options.allowMultiple === true;
  const allowAllValue = definition?.options.allowAllValue === true;

  const loadOptions = useCallback(async () => {
    if (!variablePlugin) {
      return;
    }
    setVariableLoading(name, true);
    try {
      const { data } = await variablePlugin.getVariableOptions();
      setVariableOptions(name, data);
    } catch (e) {
      console.error('Failed to load template variable options', e);
    }
    setVariableLoading(name, false);
  }, [definition]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

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

  // If there is no value and there are options loaded, select the first value
  useEffect(() => {
    const firstOption = finalOptions?.[0];
    if ((value === null || value?.length === 0) && firstOption) {
      setVariableValue(name, firstOption.value);
    }
  }, [finalOptions, setVariableValue, value, name]);

  return (
    <Box display={'flex'}>
      <FormControl>
        <InputLabel id={name}>{name}</InputLabel>
        <Select
          sx={{ minWidth: 100 }}
          id={name}
          label={name}
          value={value ?? ''}
          onChange={(e) => {
            // Must be selected
            if (e.target.value === null || e.target.value.length === 0) {
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
  const s = useTemplateVariableStore();
  const setVariableValue = s.setVariableValue;
  const ref = useRef<HTMLInputElement>(null);
  return (
    <TextField
      ref={ref}
      defaultValue={state?.value}
      onBlur={(e) => setVariableValue(name, e.target.value)}
      placeholder={name}
      label={name}
    />
  );
}
