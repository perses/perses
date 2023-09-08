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
import React, { Dispatch, DispatchWithoutAction, useCallback, useState } from 'react';
import { DiscardChangesConfirmationDialog } from '@perses-dev/components';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useIsReadonly } from '@perses-dev/app/src/model/config-client';
import { PluginEditor } from '../PluginEditor';
import { Action, getSubmitText, getTitleAction } from '../../utils';
import { datasourceEditValidationSchema, DatasourceEditValidationType } from '../../validation';

/**
 * This preprocessing ensures that we always have a defined object for the `display` property
 * @param datasource
 */
function getInitialState<T extends Datasource>(datasource: T): T {
  const patchedDisplay: Display = {
    name: datasource.spec.display?.name ?? '',
    description: datasource.spec.display?.description ?? '',
  };

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
  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);
  const isReadonly = useIsReadonly();

  const form = useForm<DatasourceEditValidationType>({
    resolver: zodResolver(datasourceEditValidationSchema),
    mode: 'onBlur',
    defaultValues: {
      name: state.metadata.name,
      title: state.spec.display?.name,
      description: state.spec.display?.description,
      default: state.spec.default,
    },
  });

  const processForm: SubmitHandler<DatasourceEditValidationType> = () => {
    onSave(state);
  };

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  const handleCancel = useCallback(() => {
    if (JSON.stringify(patchedInitialDatasource) !== JSON.stringify(state)) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  }, [state, patchedInitialDatasource, setDiscardDialogOpened, onClose]);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(processForm)}>
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
                <Button type="submit" disabled={isReadonly} variant="contained" onClick={() => setAction('update')}>
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
            ) : (
              <>
                <Button type="submit" variant="contained" disabled={!form.formState.isValid}>
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
              <Controller
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    name="name"
                    label="Name"
                    InputProps={{
                      disabled: action === 'update',
                      readOnly: action === 'read',
                    }}
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                      setState((draft) => {
                        draft.metadata.name = event.target.value;
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
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
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
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
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
      </form>
    </FormProvider>
  );
}
