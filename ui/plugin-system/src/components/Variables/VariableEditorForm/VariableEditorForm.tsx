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
import { useImmer } from 'use-immer';
import { VariableDefinition, ListVariableDefinition } from '@perses-dev/core';
import { DiscardChangesConfirmationDialog, ErrorBoundary } from '@perses-dev/components';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Action, getSubmitText, getTitleAction } from '../../../utils';
import { VARIABLE_TYPES } from '../variable-model';
import { ControlledPluginEditor } from '../../PluginEditor';
import { useValidation } from '../../../validation';
import { VariableListPreview, VariablePreview } from './VariablePreview';
import { VariableEditorState, getVariableDefinitionFromState, getInitialState } from './variable-editor-form-model';

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

  const { variableEditorFormSchema } = useValidation();
  const form = useForm({
    resolver: zodResolver(
      variableEditorFormSchema.refine(
        ({ kind, listVariableFields, textVariableFields }) =>
          (kind === 'TextVariable' && textVariableFields) || (kind === 'ListVariable' && listVariableFields),
        'Variable spec not filled correctly'
      )
    ),
    mode: 'onBlur',
    // TODO: zod schema not typed correctly, defaultValues: state,
    defaultValues: {
      name: state.name,
      title: state.title,
      kind: state.kind,
      description: state.description,
      listVariableFields: {
        allowMultiple: state.listVariableFields.allowMultiple,
        allowAll: state.listVariableFields.allowAll,
        capturingRegexp: state.listVariableFields.capturingRegexp,
        plugin: {
          kind: state.listVariableFields.plugin.kind,
          spec: state.listVariableFields.plugin.spec as Record<string, object>,
        },
        customAllValue: state.listVariableFields.customAllValue,
      },
      textVariableFields: {
        value: state.textVariableFields.value,
        constant: state.textVariableFields.constant,
      },
    },
  });

  function processForm() {
    onSave(getVariableDefinitionFromState(state));
  }

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
                    disabled: action === 'update',
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
                  onChange={(event) => {
                    field.onChange(event);
                    setState((draft) => {
                      draft.kind = event.target.value as VariableEditorState['kind'];
                      if ((event.target.value as VariableEditorState['kind']) === 'TextVariable') {
                        draft.listVariableFields = {} as VariableEditorState['listVariableFields'];
                      } else {
                        draft.textVariableFields = {} as VariableEditorState['textVariableFields'];
                      }
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
                    value={state.textVariableFields.value}
                    InputLabelProps={{
                      shrink: action === 'read' ? true : undefined,
                    }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
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
                name="textVariableFields.value"
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        {...field}
                        checked={state.textVariableFields.constant ?? false}
                        readOnly={action === 'read'}
                        onChange={(event) => {
                          if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                          field.onChange(event);
                          setState((draft) => {
                            draft.textVariableFields.constant = event.target.checked;
                          });
                        }}
                      />
                    }
                    label="Constant"
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
                <ControlledPluginEditor
                  width="100%"
                  pluginType="Variable"
                  pluginKindLabel="Source"
                  value={state.listVariableFields.plugin}
                  isReadonly={action === 'read'}
                  onChange={(val) => {
                    setState((draft) => {
                      draft.listVariableFields.plugin = val;
                    });
                  }}
                />
              </Stack>

              <Stack>
                <TextField
                  label="Capturing Regexp Filter"
                  value={state.listVariableFields.capturingRegexp || ''}
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    readOnly: action === 'read',
                  }}
                  onChange={(e) => {
                    setState((draft) => {
                      if (e.target.value) {
                        // TODO: do a better fix, if empty string => it should skip the filter
                        draft.listVariableFields.capturingRegexp = e.target.value;
                      } else {
                        draft.listVariableFields.capturingRegexp = undefined;
                      }
                    });
                  }}
                  helperText="Optional, if you want to filter on captured result."
                />
              </Stack>
            </Stack>

            <Divider />

            <Typography py={1} variant="subtitle1">
              Dropdown Options
            </Typography>
            <Stack spacing="2">
              <Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.listVariableFields.allowMultiple}
                      readOnly={action === 'read'}
                      onChange={(e) => {
                        if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                        setState((draft) => {
                          draft.listVariableFields.allowMultiple = e.target.checked;
                        });
                      }}
                    />
                  }
                  label="Allow Multiple Values"
                />
                <Typography variant="caption">Enables multiple values to be selected at the same time</Typography>
              </Stack>
              <Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.listVariableFields.allowAll}
                      readOnly={action === 'read'}
                      onChange={(e) => {
                        if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                        setState((draft) => {
                          draft.listVariableFields.allowAll = e.target.checked;
                        });
                      }}
                    />
                  }
                  label="Allow All option"
                />
                <Typography mb={1} variant="caption">
                  Enables an option to include all variable values
                </Typography>
                {state.listVariableFields.allowAll && (
                  <TextField
                    label="Custom All Value"
                    value={state.listVariableFields.customAllValue}
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    onChange={(e) => {
                      setState((draft) => {
                        if (e.target.value) {
                          draft.listVariableFields.customAllValue = e.target.value;
                        } else {
                          draft.listVariableFields.customAllValue = undefined;
                        }
                      });
                    }}
                    helperText="When All is selected, this value will be used"
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
