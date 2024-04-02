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

import React, { DispatchWithoutAction, useCallback, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  TextField,
  Grid,
  FormControlLabel,
  MenuItem,
  Button,
  Stack,
  ClickAwayListener,
  Divider,
} from '@mui/material';
import { VariableDefinition, ListVariableDefinition, Action } from '@perses-dev/core';
import { DiscardChangesConfirmationDialog, ErrorBoundary } from '@perses-dev/components';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useImmer } from 'use-immer';
import { getSubmitText, getTitleAction } from '../../../utils';
import { VARIABLE_TYPES } from '../variable-model';
import { PluginEditor } from '../../PluginEditor';
import { variableEditorValidationSchema, VariableEditorValidationType } from '../../../validation';
import { VariableListPreview, VariablePreview } from './VariablePreview';
import { getVariableDefinitionFromState, getInitialState, VariableEditorState } from './variable-editor-form-model';

function FallbackPreview() {
  return <div>Error previewing values</div>;
}

interface VariableEditorFormProps {
  initialVariableDefinition: VariableDefinition;
  initialAction: Action;
  isDraft: boolean;
  isReadonly?: boolean;
  onSave: (def: VariableDefinition) => void;
  onClose: () => void;
  onDelete?: DispatchWithoutAction;
}

export function VariableEditorForm(props: VariableEditorFormProps) {
  const { initialVariableDefinition, initialAction, isDraft, isReadonly, onSave, onClose, onDelete } = props;

  const initialState = getInitialState(initialVariableDefinition);
  const [state, setState] = useImmer(initialState);
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [action, setAction] = useState(initialAction);

  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  /** We use the `previewKey` that we increment to know when to explicitly update the
   * spec that will be used for preview. The reason why we do this is to avoid
   * having to re-fetch the values when the user is still editing the spec.
   */
  const previewSpec = useMemo(() => {
    return getVariableDefinitionFromState(state) as ListVariableDefinition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const form = useForm<VariableEditorValidationType>({
    resolver: zodResolver(variableEditorValidationSchema),
    mode: 'onBlur',
    defaultValues: initialState,
  });

  const processForm: SubmitHandler<VariableEditorValidationType> = () => {
    // reset display attributes to undefined when empty, because we don't want to save empty strings
    onSave(
      getVariableDefinitionFromState({
        ...state,
        title: state.title === '' ? undefined : state.title,
        description: state.description === '' ? undefined : state.description,
      })
    );
  };

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
  }, [initialState, state, onClose]);

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
        <Typography variant="h2">{titleAction} Variable</Typography>
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
              <Button
                type="submit"
                variant="contained"
                disabled={!form.formState.isValid}
                onClick={form.handleSubmit(processForm)}
              >
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
          <Grid item xs={8}>
            <Controller
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  label="Name"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    disabled: action === 'update' && !isDraft,
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  value={state.name}
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
          <Grid item xs={4}>
            <Controller
              name="title"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Display Label"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  value={state.title ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                    setState((draft) => {
                      draft.title = event.target.value;
                    });
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={8}>
            <Controller
              name="description"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Description"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  value={state.description ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                    setState((draft) => {
                      draft.description = event.target.value;
                    });
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={4}>
            <Controller
              name="kind"
              render={({ field, fieldState }) => (
                <TextField
                  select
                  {...field}
                  fullWidth
                  label="Type"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  value={state.kind}
                  onChange={(event) => {
                    field.onChange(event);
                    setState((draft) => {
                      draft.kind = event.target.value as VariableEditorState['kind'];
                    });
                  }}
                >
                  {VARIABLE_TYPES.map((v) => (
                    <MenuItem key={v.kind} value={v.kind}>
                      {v.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </Grid>

        <Divider />

        {state.kind === 'TextVariable' && (
          <>
            <Typography py={1} variant="subtitle1">
              Text Options
            </Typography>
            <Stack spacing={2}>
              <Box>
                <VariablePreview values={[state.textVariableFields.value]} />
              </Box>
              <Controller
                name="textVariableFields.value"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Value"
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    value={state.textVariableFields.value}
                    onChange={(event) => {
                      field.onChange(event);
                      setState((draft) => {
                        draft.textVariableFields.value = event.target.value;
                      });
                    }}
                  />
                )}
              />
              <Controller
                name="textVariableFields.constant"
                render={({ field }) => (
                  <FormControlLabel
                    label="Constant"
                    control={
                      <Switch
                        {...field}
                        checked={!!field.value}
                        readOnly={action === 'read'}
                        value={state.textVariableFields.constant}
                        onChange={(event) => {
                          if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                          field.onChange(event);
                          setState((draft) => {
                            draft.textVariableFields.constant = event.target.checked;
                          });
                        }}
                      />
                    }
                  />
                )}
              />
            </Stack>
          </>
        )}

        {state.kind === 'ListVariable' && (
          <>
            <Typography py={1} variant="subtitle1">
              List Options
            </Typography>
            <Stack spacing={2} mb={2}>
              {state.listVariableFields.plugin.kind ? (
                <Box>
                  <ErrorBoundary FallbackComponent={FallbackPreview} resetKeys={[previewSpec]}>
                    <VariableListPreview definition={previewSpec} onRefresh={refreshPreview} />
                  </ErrorBoundary>
                </Box>
              ) : (
                <VariablePreview isLoading={true} />
              )}

              <Stack>
                {/** Hack?: Cool technique to refresh the preview to simulate onBlur event */}
                <ClickAwayListener onClickAway={() => refreshPreview()}>
                  <Box />
                </ClickAwayListener>
                {/** */}
                <Controller
                  name="listVariableFields.plugin"
                  render={({ field }) => (
                    <PluginEditor
                      width="100%"
                      pluginType="Variable"
                      pluginKindLabel="Source"
                      isReadonly={action === 'read'}
                      value={{ ...state.listVariableFields.plugin }}
                      onChange={(val) => {
                        field.onChange(val);
                        setState((draft) => {
                          draft.listVariableFields.plugin = val;
                        });
                      }}
                    />
                  )}
                />
              </Stack>

              <Stack>
                <Controller
                  name="listVariableFields.capturingRegexp"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Capturing Regexp Filter"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      value={state.listVariableFields.capturingRegexp ?? ''}
                      onChange={(event) => {
                        field.onChange(event);
                        setState((draft) => {
                          if (event.target.value) {
                            // TODO: do a better fix, if empty string => it should skip the filter
                            draft.listVariableFields.capturingRegexp = event.target.value;
                          } else {
                            draft.listVariableFields.capturingRegexp = undefined;
                          }
                        });
                      }}
                      helperText={
                        fieldState.error?.message
                          ? fieldState.error.message
                          : 'Optional, if you want to filter on captured result.'
                      }
                    />
                  )}
                />
              </Stack>

              <Stack>
                <Controller
                  name="listVariableFields.sort"
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      {...field}
                      fullWidth
                      label="Sort"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      value={state.listVariableFields.sort ?? 'none'}
                      onChange={(event) => {
                        field.onChange(event);
                        setState((draft) => {
                          draft.listVariableFields.sort = event.target.value;
                        });
                      }}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="alphabetical-asc">Alphabetical, asc</MenuItem>
                      <MenuItem value="alphabetical-desc">Alphabetical, desc</MenuItem>
                      <MenuItem value="numerical-asc">Numerical, asc</MenuItem>
                      <MenuItem value="numerical-desc">Numerical, desc</MenuItem>
                      <MenuItem value="alphabetical-ci-asc">Alphabetical, case-insensitive, asc</MenuItem>
                      <MenuItem value="alphabetical-ci-desc">Alphabetical, case-insensitive, desc</MenuItem>
                    </TextField>
                  )}
                />
              </Stack>
            </Stack>

            <Divider />

            <Typography py={1} variant="subtitle1">
              Dropdown Options
            </Typography>
            <Stack spacing="2">
              <Stack>
                <Controller
                  name="listVariableFields.allowMultiple"
                  render={({ field }) => (
                    <FormControlLabel
                      label="Allow Multiple Values"
                      control={
                        <Switch
                          {...field}
                          checked={!!field.value}
                          readOnly={action === 'read'}
                          value={state.listVariableFields.allowMultiple}
                          onChange={(event) => {
                            if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                            field.onChange(event);
                            setState((draft) => {
                              draft.listVariableFields.allowMultiple = event.target.checked;
                            });
                          }}
                        />
                      }
                    />
                  )}
                />
                <Typography variant="caption">Enables multiple values to be selected at the same time</Typography>
              </Stack>
              <Stack>
                <Controller
                  name="listVariableFields.allowAllValue"
                  render={({ field }) => (
                    <FormControlLabel
                      label="Allow All option"
                      control={
                        <Switch
                          {...field}
                          checked={!!field.value}
                          readOnly={action === 'read'}
                          value={state.listVariableFields.allowAllValue}
                          onChange={(event) => {
                            if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                            field.onChange(event);
                            setState((draft) => {
                              draft.listVariableFields.allowAllValue = event.target.checked;
                            });
                          }}
                        />
                      }
                    />
                  )}
                />
                <Typography mb={1} variant="caption">
                  Enables an option to include all variable values
                </Typography>
                {state.listVariableFields.allowAllValue && (
                  <Controller
                    name="listVariableFields.customAllValue"
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Custom All Value"
                        InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                        InputProps={{
                          readOnly: action === 'read',
                        }}
                        error={!!fieldState.error}
                        helperText={
                          fieldState.error?.message
                            ? fieldState.error.message
                            : 'When All is selected, this value will be used'
                        }
                        value={state.listVariableFields.customAllValue ?? ''}
                        onChange={(event) => {
                          field.onChange(event);
                          setState((draft) => {
                            if (event.target.value) {
                              draft.listVariableFields.customAllValue = event.target.value;
                            } else {
                              draft.listVariableFields.customAllValue = undefined;
                            }
                          });
                        }}
                      />
                    )}
                  />
                )}
              </Stack>
            </Stack>
          </>
        )}
      </Box>
      <DiscardChangesConfirmationDialog
        description="Are you sure you want to discard these changes? Changes cannot be recovered."
        isOpen={isDiscardDialogOpened}
        onCancel={() => {
          setDiscardDialogOpened(false);
        }}
        onDiscardChanges={() => {
          setDiscardDialogOpened(false);
          onClose();
        }}
      />
    </FormProvider>
  );
}
