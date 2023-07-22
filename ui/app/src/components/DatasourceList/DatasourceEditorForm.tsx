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
import { Box, Button, Divider, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import { DispatchWithoutAction, useCallback, useMemo, useState } from 'react';
import { PluginEditor } from '@perses-dev/plugin-system';
import { DiscardChangesConfirmationDialog } from '@perses-dev/components';
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
  saveActionStr: string;
  onSave: (datasource: Datasource) => void;
  onClose: DispatchWithoutAction;
  onDelete: DispatchWithoutAction | undefined;
}

export function DatasourceEditorForm(props: DatasourceEditorFormProps) {
  const { initialDatasource, saveActionStr, onSave, onClose, onDelete } = props;
  const [isDiscardDialogStateOpened, setDiscardDialogStateOpened] = useState<boolean>(false);
  const isReadonly = useIsReadonly();
  const initialState = getInitialState(initialDatasource);
  const [state, setState] = useImmer(initialState);
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

  // When the user clicks on cancel, ask for discard approval if anything was changed
  const handleCancel = useCallback(() => {
    if (JSON.stringify(initialState) !== JSON.stringify(state)) {
      setDiscardDialogStateOpened(true);
    } else {
      onClose();
    }
  }, [state, initialState, setDiscardDialogStateOpened, onClose]);

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
        <Typography variant="h2">{saveActionStr} Datasource</Typography>
        <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
          <Button disabled={isReadonly || !validation.isValid} variant="contained" onClick={handleSave}>
            {saveActionStr}
          </Button>
          <Button color="secondary" variant="outlined" onClick={handleCancel}>
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
                setState((draft) => {
                  if (draft.spec.display) {
                    draft.spec.display.description = v.target.value;
                  }
                });
              }}
            />
          </Grid>
          <Grid item xs={6} sx={{ paddingTop: '5px !important' }}>
            <Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.spec.default}
                    readOnly={isReadonly}
                    onChange={(v) => {
                      setState((draft) => {
                        draft.spec.default = v.target.checked;
                      });
                    }}
                  />
                }
                label="Set as default"
              />
              <Typography variant="caption">
                Whether this datasource should be the default {state.spec.plugin.kind} to be used
              </Typography>
            </Stack>
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
            setState((draft) => {
              draft.spec.plugin = v;
            });
          }}
        />
      </Box>
      <DiscardChangesConfirmationDialog
        description="Are you sure you want to discard your changes? Changes cannot be recovered."
        isOpen={isDiscardDialogStateOpened}
        onCancel={() => setDiscardDialogStateOpened(false)}
        onDiscardChanges={() => {
          setDiscardDialogStateOpened(false);
          onClose();
        }}
      />
    </>
  );
}
