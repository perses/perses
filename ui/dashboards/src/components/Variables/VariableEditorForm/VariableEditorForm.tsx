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

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Switch,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Stack,
} from '@mui/material';
import { useImmer } from 'use-immer';
import { PluginEditor } from '@perses-dev/plugin-system';
import { VariableDefinition } from '@perses-dev/core';
import { VariableEditorState, getVariableDefinitionFromState, getInitialState } from './variable-editor-form-model';

const VARIABLE_TYPES = ['ListVariable', 'TextVariable'] as const;

// TODO: Replace with proper validation library
function getValidation(state: ReturnType<typeof getInitialState>) {
  /** Name validation */
  let name = null;
  if (!state.name) {
    name = 'Name is required';
  }
  // name can only contain alphanumeric characters and underscores and no spaces
  if (state.name && !/^[a-zA-Z0-9_-]+$/.test(state.name)) {
    name = 'Name can only contain alphanumeric characters, underscores, and dashes';
  }

  return {
    name,
    isValid: !name,
  };
}

const SectionHeader = ({ children }: React.PropsWithChildren) => (
  <Typography pb={2} variant="subtitle1">
    {children}
  </Typography>
);

export function VariableEditForm({
  initialVariableDefinition,
  onChange,
  onCancel,
}: {
  initialVariableDefinition: VariableDefinition;
  onChange: (def: VariableDefinition) => void;
  onCancel: () => void;
}) {
  const [state, setState] = useImmer(getInitialState(initialVariableDefinition));
  const validation = useMemo(() => getValidation(state), [state]);

  return (
    <Box>
      <SectionHeader>General</SectionHeader>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6}>
          <TextField
            required
            error={!!validation.name}
            fullWidth
            label="Name"
            value={state.name}
            helperText={validation.name}
            onChange={(v) => {
              setState((draft) => {
                draft.name = v.target.value as string;
              });
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel id="variable-type-select-label">Type</InputLabel>
            <Select
              labelId="variable-type-select-label"
              id="variable-type-select"
              label="Type"
              value={state.kind}
              onChange={(v) => {
                setState((draft) => {
                  draft.kind = v.target.value as VariableEditorState['kind'];
                });
              }}
            >
              {VARIABLE_TYPES.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Label"
            value={state.title}
            onChange={(v) => {
              setState((draft) => {
                draft.title = v.target.value;
              });
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={state.description}
            onChange={(v) => {
              setState((draft) => {
                draft.description = v.target.value;
              });
            }}
          />
        </Grid>
      </Grid>

      {state.kind === 'TextVariable' && (
        <>
          <SectionHeader>Text Options</SectionHeader>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12}>
              <TextField
                label="Value"
                value={state.textVariableFields.value}
                onChange={(v) => {
                  setState((draft) => {
                    draft.textVariableFields.value = v.target.value;
                  });
                }}
              />
            </Grid>
          </Grid>
        </>
      )}

      {state.kind === 'ListVariable' && (
        <>
          <SectionHeader>List Options</SectionHeader>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6}>
              <PluginEditor
                width={500}
                pluginType="Variable"
                pluginKindLabel="Source"
                value={state.listVariableFields.plugin}
                onChange={(val) => {
                  setState((draft) => {
                    draft.listVariableFields.plugin = val;
                  });
                }}
              />
            </Grid>
          </Grid>

          <SectionHeader>Dropdown Options</SectionHeader>
          <Grid container spacing={1} mb={1}>
            <Grid item xs={12}>
              Allow Multiple
              <Switch
                checked={state.listVariableFields.allowMultiple}
                onChange={(e) => {
                  setState((draft) => {
                    draft.listVariableFields.allowMultiple = e.target.checked;
                  });
                }}
              />
            </Grid>
            <Grid item xs={12}>
              Allow All
              <Switch
                checked={state.listVariableFields.allowAll}
                onChange={(e) => {
                  setState((draft) => {
                    draft.listVariableFields.allowAll = e.target.checked;
                  });
                }}
              />
            </Grid>
          </Grid>
        </>
      )}

      <Stack direction={'row'} spacing={2} justifyContent="end">
        <Button
          disabled={!validation.isValid}
          variant="contained"
          onClick={() => {
            onChange(getVariableDefinitionFromState(state));
          }}
        >
          Update
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}
