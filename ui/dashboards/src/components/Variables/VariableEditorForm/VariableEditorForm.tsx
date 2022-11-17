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

import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  TextField,
  Grid,
  Button,
  Stack,
  Alert,
  Chip,
  IconButton,
  ClickAwayListener,
} from '@mui/material';
import { useImmer } from 'use-immer';
import { PluginEditor } from '@perses-dev/plugin-system';
import { VariableDefinition, ListVariableDefinition } from '@perses-dev/core';
import { ErrorBoundary } from '@perses-dev/components';
import Refresh from 'mdi-material-ui/Refresh';

import { useListVariablePluginValues } from '../variable-model';
import { getVariableDefinitionFromState, getInitialState } from './variable-editor-form-model';

const DEFAULT_MAX_PREVIEW_VALUES = 50;

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

function VariableListPreview({ definition }: { definition: ListVariableDefinition }) {
  const { data, isFetching, error } = useListVariablePluginValues(definition);
  const [maxValues, setMaxValues] = useState<number | undefined>(DEFAULT_MAX_PREVIEW_VALUES);
  const showAll = () => {
    setMaxValues(undefined);
  };
  let notShown = 0;

  if (data && data?.length > 0 && maxValues) {
    notShown = data.length - maxValues;
  }
  const errorMessage = (error as Error)?.message;

  return (
    <Box>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {isFetching && 'Loading...'}
      {data?.length === 0 && <Alert severity="info">No results</Alert>}
      <>
        {data?.slice(0, maxValues).map((val) => (
          <Chip sx={{ mr: 1, mb: 1 }} size="small" key={val.value} label={val.label} />
        ))}
        {notShown > 0 && (
          <Chip onClick={showAll} variant="outlined" sx={{ mr: 1, mb: 1 }} size="small" label={`+${notShown} more`} />
        )}
      </>
    </Box>
  );
}

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

  const [previewKey, setPreviewKey] = React.useState(0);

  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  /** We use the `previewKey` that we increment to know when to explicity update the
   * spec that will be used for preview. The reason why we do this is to avoid
   * having to re-fetch the values when the user is still editing the spec.
   */
  const previewSpec = useMemo(() => {
    return getVariableDefinitionFromState(state) as ListVariableDefinition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: (theme) => theme.spacing(1, 2),
          borderBottom: (theme) => `1px solid ${theme.palette.grey[100]}`,
        }}
      >
        <Typography variant="h2">Template Variables / Edit Variable</Typography>
        <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
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
      <Box p={2}>
        <Typography variant="h3" mb={2}>
          Edit Variable
        </Typography>
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
              {/** Hack?: Cool technique to refresh the preview to simulate onBlur event */}
              <ClickAwayListener onClickAway={() => refreshPreview()}>
                <Box />
              </ClickAwayListener>
              {/** */}
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
            <Grid item xs={12}>
              <ErrorBoundary FallbackComponent={() => <div>Error</div>}>
                <Stack direction={'row'} spacing={1} alignItems="center">
                  <Typography variant="caption">Preview Values</Typography>
                  <IconButton onClick={refreshPreview} size="small">
                    <Refresh />
                  </IconButton>
                </Stack>
                <VariableListPreview definition={previewSpec} />
              </ErrorBoundary>
            </Grid>
          </Grid>

          <SectionHeader>Dropdown Options</SectionHeader>
          <Grid container spacing={1} mb={1}>
            <Grid item xs={12}>
              Allow Multiple
              <Switch
                checked={state.listVariableFields.allowMultiple}
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
        </Box>
      </Box>
    </>
  );
}
