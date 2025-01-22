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

import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Divider, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import { DiscardChangesConfirmationDialog, FormActions } from '@perses-dev/components';
import { Action, DatasourceDefinition } from '@perses-dev/core';
import { DispatchWithoutAction, ReactElement, useState } from 'react';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useValidationSchemas } from '../../context';
import { getSubmitText, getTitleAction } from '../../utils';
import { PluginEditor } from '../PluginEditor';

interface DatasourceEditorFormProps {
  initialDatasourceDefinition: DatasourceDefinition;
  action: Action;
  isDraft: boolean;
  isReadonly?: boolean;
  onActionChange?: (action: Action) => void;
  onSave: (def: DatasourceDefinition) => void;
  onClose: DispatchWithoutAction;
  onDelete?: DispatchWithoutAction;
}

export function DatasourceEditorForm(props: DatasourceEditorFormProps): ReactElement {
  const { initialDatasourceDefinition, action, isDraft, isReadonly, onActionChange, onSave, onClose, onDelete } = props;

  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);
  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const { datasourceEditorSchema } = useValidationSchemas();
  const form = useForm<DatasourceDefinition>({
    resolver: zodResolver(datasourceEditorSchema),
    mode: 'onBlur',
    defaultValues: initialDatasourceDefinition,
  });

  /*
   * Remove empty fields that are optional
   */
  function clearFormData(data: DatasourceDefinition): DatasourceDefinition {
    const result = { ...data };
    if (result.spec.display?.name === undefined && result.spec.display?.description === undefined) {
      delete result.spec.display;
    }
    return result;
  }

  const processForm: SubmitHandler<DatasourceDefinition> = (data: DatasourceDefinition) => {
    onSave(clearFormData(data));
  };

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel(): void {
    if (JSON.stringify(initialDatasourceDefinition) !== JSON.stringify(clearFormData(form.getValues()))) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  }

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
        <FormActions
          action={action}
          submitText={submitText}
          isReadonly={isReadonly}
          isValid={form.formState.isValid}
          onActionChange={onActionChange}
          onSubmit={form.handleSubmit(processForm)}
          onDelete={onDelete}
          onCancel={handleCancel}
        />
      </Box>
      <Box padding={2} sx={{ overflowY: 'scroll' }}>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={4}>
            <Controller
              control={form.control}
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
                  value={field.value ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={8}>
            <Controller
              control={form.control}
              name="spec.display.name"
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
                  value={field.value ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              control={form.control}
              name="spec.display.description"
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
                  value={field.value ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sx={{ paddingTop: '5px !important' }}>
            <Stack>
              <Controller
                control={form.control}
                name="spec.default"
                render={({ field }) => (
                  <FormControlLabel
                    label="Set as default"
                    control={
                      <Switch
                        {...field}
                        checked={!!field.value}
                        readOnly={action === 'read'}
                        onChange={(event) => {
                          if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                          field.onChange(event);
                        }}
                      />
                    }
                  />
                )}
              />
              <Typography variant="caption">
                Whether this datasource should be the default {form.getValues().spec.plugin.kind} to be used
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        <Divider />
        <Typography py={1} variant="h3">
          Plugin Options
        </Typography>
        <Controller
          control={form.control}
          name="spec.plugin"
          render={({ field }) => (
            <PluginEditor
              width="100%"
              pluginTypes={['Datasource']}
              pluginKindLabel="Source"
              value={{
                selection: {
                  type: 'Datasource',
                  kind: field.value.kind,
                },
                spec: field.value.spec,
              }}
              isReadonly={action === 'read'}
              onChange={(v) => {
                field.onChange({ kind: v.selection.kind, spec: v.spec });
              }}
            />
          )}
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
