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

import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  TextField,
  Grid,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Button,
  Stack,
  ClickAwayListener,
  Divider,
  Select,
  capitalize,
} from '@mui/material';
import { useImmer } from 'use-immer';
import { VariableDefinition, ListVariableDefinition } from '@perses-dev/core';
import { DiscardChangesConfirmationDialog, ErrorBoundary } from '@perses-dev/components';
import { VARIABLE_TYPES } from '../variable-model';
import { PluginEditor } from '../../PluginEditor';
import { VariableListPreview, VariablePreview } from './VariablePreview';
import { VariableEditorState, getVariableDefinitionFromState, getInitialState } from './variable-editor-form-model';

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

function FallbackPreview() {
  return <div>Error previewing values</div>;
}

export type Action = 'create' | 'read' | 'update';

interface VariableEditFormProps {
  initialVariableDefinition: VariableDefinition;
  onChange: (def: VariableDefinition) => void;
  onCancel: () => void;
  action?: Action;
}

export function VariableEditForm(props: VariableEditFormProps) {
  const { initialVariableDefinition, onChange, onCancel, action = 'update' } = props;
  const initialState = getInitialState(initialVariableDefinition);
  const [state, setState] = useImmer(initialState);
  const validation = useMemo(() => getValidation(state), [state]);
  const [isDiscardDialogStateOpened, setDiscardDialogStateOpened] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState(0);

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

  const title = useMemo(() => {
    if (action === 'read') return 'View Variable';
    if (action === 'create') return 'Create Variable';
    if (action === 'update') return 'Edit Variable';
    return '';
  }, [action]);

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  const handleCancel = useCallback(() => {
    if (action === 'create' || (action === 'update' && JSON.stringify(initialState) !== JSON.stringify(state))) {
      setDiscardDialogStateOpened(true);
    } else {
      onCancel();
    }
  }, [state, initialState, action, setDiscardDialogStateOpened, onCancel]);

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
        <Typography variant="h2">{title}</Typography>
        <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
          {action !== 'read' && (
            <Button
              disabled={!validation.isValid}
              variant="contained"
              onClick={() => {
                onChange(getVariableDefinitionFromState(state));
              }}
            >
              {capitalize(action)}
            </Button>
          )}
          <Button color="secondary" variant="outlined" onClick={handleCancel}>
            {action === 'read' ? 'Close' : 'Cancel'}
          </Button>
        </Stack>
      </Box>
      <Box padding={2} sx={{ overflowY: 'scroll' }}>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={8}>
            <TextField
              required
              error={!!validation.name}
              fullWidth
              label="Name"
              value={state.name}
              helperText={validation.name}
              InputProps={{
                readOnly: action === 'update' || action === 'read',
              }}
              onChange={(v) => {
                setState((draft) => {
                  draft.name = v.target.value;
                });
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Display Label"
              value={state.title || ''}
              InputProps={{
                readOnly: action === 'read',
              }}
              onChange={(v) => {
                setState((draft) => {
                  draft.title = v.target.value;
                });
              }}
            />
          </Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Description"
              value={state.description}
              InputProps={{
                readOnly: action === 'read',
              }}
              onChange={(v) => {
                setState((draft) => {
                  draft.description = v.target.value;
                });
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel id="variable-type-select-label">Type</InputLabel>
              <Select
                labelId="variable-type-select-label"
                id="variable-type-select"
                label="Type"
                value={state.kind}
                readOnly={action === 'read'}
                onChange={(v) => {
                  setState((draft) => {
                    draft.kind = v.target.value as VariableEditorState['kind'];
                  });
                }}
              >
                {VARIABLE_TYPES.map((v) => (
                  <MenuItem key={v.kind} value={v.kind}>
                    {v.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              <TextField
                label="Value"
                value={state.textVariableFields.value}
                InputProps={{
                  readOnly: action === 'read',
                }}
                onChange={(v) => {
                  setState((draft) => {
                    draft.textVariableFields.value = v.target.value;
                  });
                }}
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
                <PluginEditor
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
                  value={state.listVariableFields.capturing_regexp || ''}
                  InputProps={{
                    readOnly: action === 'read',
                  }}
                  onChange={(e) => {
                    setState((draft) => {
                      if (e.target.value) {
                        // TODO: do a better fix, if empty string => it should skip the filter
                        draft.listVariableFields.capturing_regexp = e.target.value;
                      } else {
                        draft.listVariableFields.capturing_regexp = undefined;
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
        isOpen={isDiscardDialogStateOpened}
        onCancel={() => {
          setDiscardDialogStateOpened(false);
        }}
        onDiscardChanges={() => {
          setDiscardDialogStateOpened(false);
          onCancel();
        }}
      />
    </>
  );
}
