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
import { Display, Datasource } from '@perses-dev/core';
import { Box, Button, Divider, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import { Dispatch, DispatchWithoutAction, useCallback, useMemo, useState } from 'react';
import { DiscardChangesConfirmationDialog } from '@perses-dev/components';
import { PluginEditor } from '../PluginEditor';
import { Action, getSubmitText, getTitleAction } from '../../utils';

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

/**
 * This preprocessing ensures that we always have a defined object for the `display` property
 * @param datasource
 */
function getInitialState<T extends Datasource>(datasource: T): T {
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

interface DatasourceEditorFormProps<T extends Datasource> {
  initialDatasource: T;
  initialAction: Action;
  isDraft: boolean;
  onSave: Dispatch<T>;
  onClose: DispatchWithoutAction;
  onDelete?: DispatchWithoutAction;
}

export function DatasourceEditorForm<T extends Datasource>(props: DatasourceEditorFormProps<T>) {
  const { initialDatasource, initialAction, isDraft, onSave, onClose, onDelete } = props;

  const patchedInitialDatasource = getInitialState(initialDatasource);
  const [state, setState] = useImmer(patchedInitialDatasource);
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);
  const [action, setAction] = useState(initialAction);
  const validation = useMemo(() => getValidation(state), [state]);
  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

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
    if (JSON.stringify(patchedInitialDatasource) !== JSON.stringify(state)) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  }, [state, patchedInitialDatasource, setDiscardDialogOpened, onClose]);

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
        <Typography variant="h2">{titleAction} Datasource</Typography>
        <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
          {action === 'read' && (
            <>
              <Button disabled={!validation.isValid} variant="contained" onClick={() => setAction('update')}>
                Edit
              </Button>
              <Button color="error" variant="outlined" onClick={onDelete}>
                Delete
              </Button>
              <Divider
                orientation="vertical"
                flexItem
                sx={(theme) => ({
                  borderColor: theme.palette.grey['500'],
                  '&.MuiDivider-root': {
                    marginLeft: 2,
                    marginRight: 1,
                  },
                })}
              />
              <Button color="secondary" variant="outlined" onClick={onClose}>
                Close
              </Button>
            </>
          )}
          {action !== 'read' && (
            <>
              <Button disabled={!validation.isValid} variant="contained" onClick={handleSave}>
                {submitText}
              </Button>
              <Button color="secondary" variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            </>
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
                disabled: action === 'update',
                readOnly: action === 'read',
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
                readOnly: action === 'read',
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
                readOnly: action === 'read',
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
                    readOnly={action === 'read'}
                    onChange={(v) => {
                      if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
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
          isReadonly={action === 'read'}
          onChange={(v) => {
            setState((draft) => {
              draft.spec.plugin = v;
            });
          }}
        />
      </Box>
      <DiscardChangesConfirmationDialog
        description="Are you sure you want to discard your changes? Changes cannot be recovered."
        isOpen={isDiscardDialogOpened}
        onCancel={() => setDiscardDialogOpened(false)}
        onDiscardChanges={() => {
          setDiscardDialogOpened(false);
          onClose();
        }}
      />
    </>
  );
}
