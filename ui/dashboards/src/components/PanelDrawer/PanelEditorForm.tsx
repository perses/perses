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

import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { PanelDefinition } from '@perses-dev/core';
import { DiscardChangesConfirmationDialog, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import {
  PluginKindSelect,
  usePluginEditor,
  PanelSpecEditor,
  Action,
  getTitleAction,
  getSubmitText,
} from '@perses-dev/plugin-system';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useListPanelGroups } from '../../context';
import { PanelEditorValues } from '../../context/DashboardProvider/panel-editor-slice';
import { panelEditorValidationSchema, PanelEditorValidationType } from '../../validation';
import { PanelPreview } from './PanelPreview';
import { usePanelEditor } from './usePanelEditor';

export interface PanelEditorFormProps {
  initialValues: PanelEditorValues;
  initialAction: Action;
  onSave: (values: PanelEditorValues) => void;
  onClose: () => void;
}

export function PanelEditorForm(props: PanelEditorFormProps) {
  const {
    initialValues: { panelDefinition: initialPanelDef, groupId: initialGroupId },
    initialAction,
    onSave,
    onClose,
  } = props;
  const panelGroups = useListPanelGroups();
  const [groupId, setGroupId] = useState(initialGroupId);
  const { panelDefinition, setName, setDescription, setQueries, setPlugin, setPanelDefinition } =
    usePanelEditor(initialPanelDef);
  const { plugin } = panelDefinition.spec;
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);

  // Use common plugin editor logic even though we've split the inputs up in this form
  const pluginEditor = usePluginEditor({
    pluginType: 'Panel',
    value: { kind: plugin.kind, spec: plugin.spec },
    onChange: (plugin) => {
      setPlugin(plugin);
    },
    onHideQueryEditorChange: (isHidden) => {
      setQueries(undefined, isHidden);
    },
  });

  const titleAction = getTitleAction(initialAction, true);
  const submitText = getSubmitText(initialAction, true);

  const form = useForm<PanelEditorValidationType>({
    resolver: zodResolver(panelEditorValidationSchema),
    mode: 'onBlur',
    defaultValues: {
      name: initialPanelDef.spec.display.name,
      groupId: initialGroupId,
      description: initialPanelDef.spec.display.description,
      type: initialPanelDef.spec.plugin.kind,
    },
  });

  function processForm() {
    const values: PanelEditorValues = { groupId, panelDefinition };
    onSave(values);
  }

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel() {
    if (
      JSON.stringify({ groupId: initialGroupId, panelDefinition: initialPanelDef }) !==
      JSON.stringify({ groupId, panelDefinition })
    ) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  }

  // Ignore string values (which would be an "empty" value from the Select) since we don't allow them to unset it
  const handleGroupChange: SelectProps<number>['onChange'] = (e) => {
    const { value } = e.target;
    if (typeof value === 'string') {
      return;
    }
    setGroupId(value);
  };

  const handlePanelDefinitionChange = (nextPanelDef: PanelDefinition) => {
    const { kind: pluginKind, spec: pluginSpec } = nextPanelDef.spec.plugin;
    // if panel plugin kind and spec are modified, then need to save current spec
    if (
      panelDefinition.spec.plugin.kind !== pluginKind &&
      JSON.stringify(panelDefinition.spec.plugin.spec) !== JSON.stringify(pluginSpec)
    ) {
      pluginEditor.rememberCurrentSpecState();
    }

    setPanelDefinition(nextPanelDef);
  };

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
          <Typography variant="h2">{titleAction} Panel</Typography>
          <Stack direction="row" spacing={1} marginLeft="auto">
            <Button type="submit" variant="contained" disabled={!form.formState.isValid}>
              {submitText}
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </Stack>
        </Box>
        <Box
          component="form"
          id={panelEditorFormId}
          sx={{ flex: 1, overflowY: 'scroll', padding: (theme) => theme.spacing(2) }}
        >
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Controller
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Name"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                      setName(event.target.value);
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="select-group">Group</InputLabel>
                {/* TODO: validation */}
                <Select required labelId="select-group" label="Group" value={groupId} onChange={handleGroupChange}>
                  {panelGroups.map((panelGroup, index) => (
                    <MenuItem key={panelGroup.id} value={panelGroup.id}>
                      {panelGroup.title ?? `Group ${index + 1}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={8}>
              <Controller
                name="description"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                      setDescription(event.target.value);
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={4}>
              {/* TODO: validation */}
              <FormControl fullWidth disabled={pluginEditor.isLoading} error={pluginEditor.error !== null}>
                <InputLabel id="panel-type-label">Type</InputLabel>
                <PluginKindSelect
                  pluginType="Panel"
                  required
                  labelId="panel-type-label"
                  label="Type"
                  value={pluginEditor.pendingKind ? pluginEditor.pendingKind : plugin.kind}
                  onChange={pluginEditor.onKindChange}
                />
              </FormControl>
              <FormHelperText>{pluginEditor.error?.message ?? ''}</FormHelperText>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h4" marginBottom={1}>
                Preview
              </Typography>
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <PanelPreview panelDefinition={panelDefinition} />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12}>
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <PanelSpecEditor
                  panelDefinition={panelDefinition}
                  onJSONChange={handlePanelDefinitionChange}
                  onQueriesChange={(queries) => {
                    setQueries(queries);
                  }}
                  onPluginSpecChange={(spec) => {
                    pluginEditor.onSpecChange(spec);
                  }}
                />
              </ErrorBoundary>
            </Grid>
          </Grid>
        </Box>
        <DiscardChangesConfirmationDialog
          description="You have unapplied changes in this panel. Are you sure you want to discard these changes? Changes cannot be recovered."
          isOpen={isDiscardDialogOpened}
          onCancel={() => {
            setDiscardDialogOpened(false);
          }}
          onDiscardChanges={() => {
            setDiscardDialogOpened(false);
            onClose();
          }}
        />
      </form>
    </FormProvider>
  );
}

/**
 * The `id` attribute added to the `PanelEditorForm` component, allowing submit buttons to live outside the form.
 */
export const panelEditorFormId = 'panel-editor-form';
