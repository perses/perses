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

import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Action, DEFAULT_DASHBOARD_DURATION, PanelDefinition, PanelEditorValues } from '@perses-dev/core';
import { DiscardChangesConfirmationDialog, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import {
  PluginKindSelect,
  usePluginEditor,
  PanelSpecEditor,
  getTitleAction,
  getSubmitText,
  useValidationSchemas,
  PluginEditorRef,
  TimeRangeProvider,
  useTimeRangeParams,
  useInitialTimeRange,
} from '@perses-dev/plugin-system';
import { Controller, FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDashboard, useListPanelGroups } from '../../context';
import { PanelEditorProvider } from '../../context/PanelEditorProvider/PanelEditorProvider';
import { PanelPreview } from './PanelPreview';
import { usePanelEditor } from './usePanelEditor';

export interface PanelEditorFormProps {
  initialValues: PanelEditorValues;
  initialAction: Action;
  onSave: (values: PanelEditorValues) => void;
  onClose: () => void;
}

export function PanelEditorForm(props: PanelEditorFormProps): ReactElement {
  const { initialValues, initialAction, onSave, onClose } = props;
  const pluginEditorRef = useRef<PluginEditorRef>(null);
  const panelGroups = useListPanelGroups();
  const { panelDefinition, setName, setDescription, setLinks, setQueries, setPlugin, setPanelDefinition } =
    usePanelEditor(initialValues.panelDefinition);
  const { plugin } = panelDefinition.spec;
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);

  const { panelEditorSchema } = useValidationSchemas();
  const form = useForm<PanelEditorValues>({
    resolver: zodResolver(panelEditorSchema),
    mode: 'onBlur',
    defaultValues: initialValues,
  });

  const { dashboard } = useDashboard();
  const dashboardDuration = dashboard?.kind === 'Dashboard' ? dashboard.spec.duration : DEFAULT_DASHBOARD_DURATION;
  const initialTimeRange = useInitialTimeRange(dashboardDuration);

  // Use common plugin editor logic even though we've split the inputs up in this form
  const pluginEditor = usePluginEditor({
    pluginTypes: ['Panel'],
    value: { selection: { kind: plugin.kind, type: 'Panel' }, spec: plugin.spec },
    onChange: (plugin) => {
      form.setValue('panelDefinition.spec.plugin', { kind: plugin.selection.kind, spec: plugin.spec });
      setPlugin({
        kind: plugin.selection.kind,
        spec: plugin.spec,
      });
    },
    onHideQueryEditorChange: (isHidden) => {
      setQueries(undefined, isHidden);
    },
  });

  const titleAction = getTitleAction(initialAction, true);
  const submitText = getSubmitText(initialAction, true);

  const links = useWatch({ control: form.control, name: 'panelDefinition.spec.links' });
  useEffect(() => {
    setLinks(links);
  }, [setLinks, links]);

  const processForm: SubmitHandler<PanelEditorValues> = useCallback(
    (data) => {
      onSave(data);
    },
    [onSave]
  );

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel(): void {
    if (JSON.stringify(initialValues) !== JSON.stringify(form.getValues())) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  }

  const handlePanelDefinitionChange = (nextPanelDefStr: string): void => {
    const nextPanelDef: PanelDefinition = JSON.parse(nextPanelDefStr);
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

  const watchedName = useWatch({ control: form.control, name: 'panelDefinition.spec.display.name' });
  const watchedDescription = useWatch({ control: form.control, name: 'panelDefinition.spec.display.description' });
  const watchedPluginKind = useWatch({ control: form.control, name: 'panelDefinition.spec.plugin.kind' });
  const { timeRange } = useTimeRangeParams(initialTimeRange);

  const handleSubmit = useCallback(() => {
    pluginEditorRef.current?.flushChanges?.();
    form.handleSubmit(processForm)();
  }, [form, processForm]);

  return (
    <TimeRangeProvider timeRange={timeRange}>
      <FormProvider {...form}>
        <PanelEditorProvider>
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
              <Button variant="contained" disabled={!form.formState.isValid} onClick={handleSubmit}>
                {submitText}
              </Button>
              <Button color="secondary" variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            </Stack>
          </Box>
          <Box id={panelEditorFormId} sx={{ flex: 1, overflowY: 'scroll', padding: (theme) => theme.spacing(2) }}>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <Controller
                  control={form.control}
                  name="panelDefinition.spec.display.name"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      label="Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      value={watchedName ?? ''}
                      onChange={(event) => {
                        field.onChange(event);
                        setName(event.target.value);
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  control={form.control}
                  name="groupId"
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      {...field}
                      required
                      fullWidth
                      label="Group"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    >
                      {panelGroups.map((panelGroup, index) => (
                        <MenuItem key={panelGroup.id} value={panelGroup.id}>
                          {panelGroup.title ?? `Group ${index + 1}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={8}>
                <Controller
                  control={form.control}
                  name="panelDefinition.spec.display.description"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      value={watchedDescription ?? ''}
                      onChange={(event) => {
                        field.onChange(event);
                        setDescription(event.target.value);
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  control={form.control}
                  name="panelDefinition.spec.plugin.kind"
                  render={({ field, fieldState }) => (
                    <PluginKindSelect
                      {...field}
                      pluginTypes={['Panel']}
                      required
                      fullWidth
                      label="Type"
                      disabled={pluginEditor.isLoading}
                      error={!!pluginEditor.error || !!fieldState.error}
                      helperText={pluginEditor.error?.message ?? fieldState.error?.message}
                      value={{ type: 'Panel', kind: watchedPluginKind }}
                      onChange={(event) => {
                        field.onChange(event.kind);
                        pluginEditor.onSelectionChange(event);
                      }}
                    />
                  )}
                />
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
                    ref={pluginEditorRef}
                    control={form.control}
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
        </PanelEditorProvider>
      </FormProvider>
    </TimeRangeProvider>
  );
}

/**
 * The `id` attribute added to the `PanelEditorForm` component, allowing submit buttons to live outside the form.
 */
export const panelEditorFormId = 'panel-editor-form';
