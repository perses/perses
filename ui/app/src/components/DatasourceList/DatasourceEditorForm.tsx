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

import { useImmer } from 'use-immer';
import { Datasource, Display } from '@perses-dev/core';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DispatchWithoutAction, useMemo } from 'react';
import { PluginEditor } from '@perses-dev/plugin-system';
import { useIsReadonly } from '../../model/config-client';

// TODO: Replace with proper validation library
function getValidation(state: Datasource) {
  /** Name validation */
  let name = null;
  if (!state.metadata.name) {
    name = 'Name is required';
  }
  // name can only contain alphanumeric characters and underscores and no spaces
  if (state.metadata.name && !/^[a-zA-Z0-9_-]+$/.test(state.metadata.name)) {
    name = 'Name can only contain alphanumeric characters, underscores, and dashes';
  }

  return {
    name,
    isValid: !name,
  };
}

// this preprocessing ensure that we always have a defined object for the `display` property:
function getInitialState(datasource: Datasource): Datasource {
  const patchedDisplay: Display = {
    name: '',
    description: '',
  };

  if (datasource.spec.display) {
    patchedDisplay.name = datasource.spec.display.name;
    if (datasource.spec.display.description) {
      patchedDisplay.description = datasource.spec.display.description;
    }
  }

  return {
    ...datasource,
    spec: {
      ...datasource.spec,
      display: patchedDisplay,
    },
  };
}

interface DatasourceEditorFormProps {
  initialDatasource: Datasource;
  saveAction: string;
  onSave: (datasource: Datasource) => void;
  onCancel: DispatchWithoutAction;
  onDelete: DispatchWithoutAction | undefined;
  flagAsDraft: DispatchWithoutAction;
}

export function DatasourceEditorForm(props: DatasourceEditorFormProps) {
  const { initialDatasource, saveAction, flagAsDraft, onSave, onCancel, onDelete } = props;

  const isReadonly = useIsReadonly();
  const [state, setState] = useImmer(getInitialState(initialDatasource));
  const validation = useMemo(() => getValidation(state), [state]);

  // When saving, remove the display property if ever display.name is empty, then pass the value upstream
  const handleSave = () => {
    onSave({
      ...state,
      spec: {
        ...state.spec,
        display: state.spec.display?.name !== '' ? state.spec.display : undefined,
      },
    });
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: (theme) => theme.spacing(1, 2),
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h2">{saveAction} Datasource</Typography>
        <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
          <Button disabled={isReadonly || !validation.isValid} variant="contained" onClick={handleSave}>
            {saveAction}
          </Button>
          <Button color="secondary" variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          {onDelete && (
            <Button disabled={isReadonly} color="error" variant="outlined" onClick={onDelete}>
              Delete
            </Button>
          )}
        </Stack>
      </Box>
      <Box padding={2} sx={{ overflowY: 'scroll' }}>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={4}>
            <TextField
              required
              error={!!validation.name}
              fullWidth
              label="Name"
              value={state.metadata.name}
              InputProps={{
                readOnly: isReadonly,
              }}
              helperText={validation.name}
              onChange={(v) => {
                flagAsDraft();
                setState((draft) => {
                  draft.metadata.name = v.target.value;
                });
              }}
            />
          </Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Display Label"
              value={state.spec.display?.name}
              InputProps={{
                readOnly: isReadonly,
              }}
              onChange={(v) => {
                flagAsDraft();
                setState((draft) => {
                  if (draft.spec.display) {
                    draft.spec.display.name = v.target.value;
                  }
                });
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={state.spec.display?.description}
              InputProps={{
                readOnly: isReadonly,
              }}
              onChange={(v) => {
                flagAsDraft();
                setState((draft) => {
                  if (draft.spec.display) {
                    draft.spec.display.description = v.target.value;
                  }
                });
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              {/* TODO: How to ensure ids are unique? */}
              <InputLabel id="datasource-default-label">Default</InputLabel>
              <Select
                labelId="datasource-default-label"
                id="datasource-default-select"
                label="Default"
                value={state.spec.default == true ? 'yes' : 'no'}
                readOnly={isReadonly}
                onChange={(v) => {
                  flagAsDraft();
                  setState((draft) => {
                    draft.spec.default = v.target.value === 'yes';
                  });
                }}
                sx={{ width: '100%' }}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
            <FormHelperText>
              Whether this datasource should be the default {state.spec.plugin.kind} to be used
            </FormHelperText>
          </Grid>
        </Grid>
        <Divider />
        <Typography py={1} variant="subtitle1">
          Plugin Options
        </Typography>
        <PluginEditor
          width="100%"
          pluginType="Datasource"
          pluginKindLabel="Source"
          value={state.spec.plugin}
          isReadonly={isReadonly}
          onChange={(v) => {
            flagAsDraft();
            setState((draft) => {
              draft.spec.plugin = v;
            });
          }}
        />
      </Box>
    </>
  );
}
