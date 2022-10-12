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

import React from 'react';
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
  Tooltip,
} from '@mui/material';
import { useImmer } from 'use-immer';
import { useListPluginMetadata, PluginSpecEditor, usePluginRegistry } from '@perses-dev/plugin-system';
import { VariableDefinition } from '@perses-dev/core';
import { VariableEditorState, getVariableDefinitionFromState, getInitialState } from './variable-editor-form-model';

const VARIABLE_TYPES = ['ListVariable', 'TextVariable'] as const;

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
  const { data: pluginList } = useListPluginMetadata('Variable');
  const { getPlugin } = usePluginRegistry();
  const [state, setState] = useImmer(getInitialState(initialVariableDefinition));

  const updatePluginKind = async (kind: string) => {
    const p = await getPlugin('Variable', kind);
    setState((draft) => {
      draft.listVariableFields.plugin.kind = kind;
      draft.listVariableFields.plugin.spec = p.createInitialOptions();
    });
  };

  return (
    <Box>
      <SectionHeader>General</SectionHeader>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6}>
          <TextField
            label="Name"
            value={state.name}
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
            label="Label"
            value={state.label}
            onChange={(v) => {
              setState((draft) => {
                draft.label = v.target.value;
              });
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
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
              <FormControl fullWidth>
                <InputLabel id="variable-source-select-label">Source</InputLabel>
                <Select
                  label="Source"
                  labelId="variable-type-select-label"
                  id="variable-source-select"
                  value={state.listVariableFields.plugin.kind}
                  onChange={(v) => updatePluginKind(v.target.value as string)}
                >
                  {pluginList?.map((v) => (
                    <MenuItem key={v.kind} value={v.kind}>
                      {v.kind}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              {state.listVariableFields.plugin.kind && (
                <>
                  <Box mb={2}>Query</Box>
                  <Box display="flex">
                    <Box flexGrow={1}>
                      <PluginSpecEditor
                        pluginKind={state.listVariableFields.plugin.kind}
                        pluginType="Variable"
                        value={state.listVariableFields.plugin.spec}
                        onChange={(val) => {
                          setState((draft) => {
                            draft.listVariableFields.plugin.spec = val;
                          });
                        }}
                      />
                    </Box>
                    <Tooltip title="Coming Soon!" placement="top">
                      <span>
                        <Button disabled>Test Query</Button>
                      </span>
                    </Tooltip>
                  </Box>
                </>
              )}
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
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            onChange(getVariableDefinitionFromState(state));
          }}
        >
          Update Variable
        </Button>
      </Stack>
    </Box>
  );
}
