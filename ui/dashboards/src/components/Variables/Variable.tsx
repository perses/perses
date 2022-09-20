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

import { useEffect, useRef } from 'react';
import { Select, FormControl, InputLabel, MenuItem, Box, LinearProgress, IconButton, TextField } from '@mui/material';
import { Reload } from 'mdi-material-ui';
import { VariableName, ListVariableDefinition } from '@perses-dev/core';
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
  const { setVariableValue, loadTemplateVariable } = useTemplateVariableActions();
  const allowMultiple = definition?.options.allowMultiple === true;
  useEffect(() => {
    loadTemplateVariable(name);
  }, [name, loadTemplateVariable]);

  let value = ctx.state?.value;

  if (allowMultiple && !Array.isArray(value)) {
    value = [];
  }

  return (
    <Box display={'flex'}>
      <FormControl>
        <InputLabel id={name}>{name}</InputLabel>
        <Select
          id={name}
          label={name}
          value={value}
          onChange={(e) => {
            setVariableValue(name, e.target.value as string);
          }}
          multiple={allowMultiple}
        >
          {ctx.state?.options?.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {ctx.state?.loading && <LinearProgress />}
      </FormControl>
      <IconButton onClick={() => loadTemplateVariable(name)}>
        <Reload />
      </IconButton>
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
