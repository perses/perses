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
import { Action, DatasourceSpec } from '@perses-dev/core';
import { Box, Button, Divider, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import { DispatchWithoutAction, useCallback, useState } from 'react';
import { DiscardChangesConfirmationDialog, useSnackbar } from '@perses-dev/components';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PluginEditor } from '../PluginEditor';
import { getSubmitText, getTitleAction } from '../../utils';
import { datasourceEditValidationSchema, DatasourceEditValidationType } from '../../validation';
import { useDatasourceStore } from '../../runtime';
import { DatasourceClient } from '../../model';

/**
 * This preprocessing ensures that we always have a defined object for the `display` property
 * @param datasource
 */
function getInitialState(name: string, spec: DatasourceSpec) {
  const patchedDisplay = {
    name: spec.display?.name ?? '',
    description: spec.display?.description ?? '',
  };

  return {
    name: name,
    spec: {
      ...spec,
      display: patchedDisplay,
    },
  };
}

interface DatasourceEditorFormProps {
  initialName: string;
  initialSpec: DatasourceSpec;
  initialAction: Action;
  isDraft: boolean;
  isReadonly?: boolean;
  project?: string;
  dashboard?: string;
  onSave: (name: string, spec: DatasourceSpec) => void;
  onClose: DispatchWithoutAction;
  onDelete?: DispatchWithoutAction;
}

export function DatasourceEditorForm(props: DatasourceEditorFormProps) {
  const { initialName, initialSpec, initialAction, isDraft, isReadonly, onSave, onClose, onDelete } = props;

  const initialState = getInitialState(initialName, initialSpec);
  const [state, setState] = useImmer(initialState);
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);
  const [action, setAction] = useState(initialAction);
  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);
  const datasourceStore = useDatasourceStore();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const form = useForm<DatasourceEditValidationType>({
    resolver: zodResolver(datasourceEditValidationSchema),
    mode: 'onBlur',
    defaultValues: {
      name: state.name,
      title: state.spec.display?.name,
      description: state.spec.display?.description,
      default: state.spec.default,
    },
  });

  const processForm: SubmitHandler<DatasourceEditValidationType> = () => {
    // reset display attributes to undefined when empty, because we don't want to save empty strings
    onSave(state.name, {
      ...state.spec,
      display: {
        name: state.spec.display?.name === '' ? undefined : state.spec.display?.name,
        description: state.spec.display?.description === '' ? undefined : state.spec.display?.description,
      },
    });
  };

  const onTest = useCallback(async () => {
    const client = await datasourceStore.getDatasourceClient<DatasourceClient>({
      spec: state.spec,
      project: props.project,
      dashboard: props.dashboard,
    });
    let healthy = true;
    if (client.healthCheck) {
      healthy = await client.healthCheck();
    }

    if (healthy) {
      successSnackbar('Datasource is healthy');
    } else {
      exceptionSnackbar('Datasource is unhealthy');
    }
  }, [datasourceStore, state.spec, successSnackbar, exceptionSnackbar, props.project, props.dashboard]);

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  const handleCancel = useCallback(() => {
    if (JSON.stringify(initialState) !== JSON.stringify(state)) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  }, [state, initialState, setDiscardDialogOpened, onClose]);

  return (
    <FormProvider {...form}>
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
          {action === 'read' ? (
            <>
              <Button disabled={isReadonly} variant="contained" onClick={() => setAction('update')}>
                Edit
              </Button>
              <Button color="error" disabled={isReadonly} variant="outlined" onClick={onDelete}>
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
          ) : (
            <>
              <Button variant="contained" disabled={!form.formState.isValid} onClick={form.handleSubmit(processForm)}>
                {submitText}
              </Button>
              <Button variant="contained" disabled={!form.formState.isValid} onClick={onTest}>
                Test
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
            <Controller
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  name="name"
                  label="Name"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    disabled: action === 'update' && !isDraft,
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  onChange={(event) => {
                    field.onChange(event);
                    setState((draft) => {
                      draft.name = event.target.value;
                    });
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={8}>
            <Controller
              name="title"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  name="title"
                  label="Display Label"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  onChange={(event) => {
                    setState((draft) => {
                      field.onChange(event);
                      if (draft.spec.display) {
                        draft.spec.display.name = event.target.value;
                      }
                    });
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="description"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  name="description"
                  label="Description"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  onChange={(event) => {
                    field.onChange(event);
                    setState((draft) => {
                      if (draft.spec.display) {
                        draft.spec.display.description = event.target.value;
                      }
                    });
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sx={{ paddingTop: '5px !important' }}>
            <Stack>
              <Controller
                name="default"
                render={({ field }) => (
                  <FormControlLabel
                    {...field}
                    control={
                      <Switch
                        checked={state.spec.default}
                        readOnly={action === 'read'}
                        onChange={(event) => {
                          if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                          field.onChange(event);
                          setState((draft) => {
                            draft.spec.default = event.target.checked;
                          });
                        }}
                      />
                    }
                    label="Set as default"
                  />
                )}
              />
              <Typography variant="caption">
                Whether this datasource should be the default {state.spec.plugin.kind} to be used
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        <Divider />
        <Typography py={1} variant="h3">
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
    </FormProvider>
  );
}
