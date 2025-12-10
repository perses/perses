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

import { DispatchWithoutAction, ReactElement, useCallback, useState } from 'react';
import { Box, Typography, Switch, TextField, Grid, FormControlLabel, MenuItem, Stack, Divider } from '@mui/material';
import { VariableDefinition, ListVariableDefinition, Action } from '@perses-dev/core';
import { DiscardChangesConfirmationDialog, ErrorAlert, ErrorBoundary, FormActions } from '@perses-dev/components';
import { Control, Controller, FormProvider, SubmitHandler, useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { getSubmitText, getTitleAction } from '../../../utils';
import { PluginEditor } from '../../PluginEditor';
import { useValidationSchemas } from '../../../context';
import { VARIABLE_TYPES } from '../variable-model';
import { VariableListPreview, VariablePreview } from './VariablePreview';
import { SORT_METHODS, SortMethodName } from './variable-editor-form-model';

function FallbackPreview(): ReactElement {
  return <div>Error previewing values</div>;
}

interface KindVariableEditorFormProps {
  action: Action;
  control: Control<VariableDefinition>;
}

function TextVariableEditorForm({ action, control }: KindVariableEditorFormProps): ReactElement {
  return (
    <>
      <Typography py={1} variant="subtitle1">
        Text Options
      </Typography>
      <Stack spacing={2}>
        <Controller
          control={control}
          name="spec.value"
          render={({ field, fieldState }) => (
            <>
              <Box>
                <VariablePreview values={[field.value]} />
              </Box>
              <TextField
                {...field}
                label="Value"
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
            </>
          )}
        />
        <Controller
          control={control}
          name="spec.constant"
          render={({ field }) => (
            <FormControlLabel
              label="Constant"
              control={
                <Switch
                  {...field}
                  checked={!!field.value}
                  readOnly={action === 'read'}
                  value={field.value ?? false}
                  onChange={(event) => {
                    if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                    field.onChange(event);
                  }}
                />
              }
            />
          )}
        />
      </Stack>
    </>
  );
}

function ListVariableEditorForm({ action, control }: KindVariableEditorFormProps): ReactElement {
  const form = useFormContext<VariableDefinition>();
  const queryClient = useQueryClient();
  /** We use `previewSpec` to know when to explicitly update the
   * spec that will be used for preview. The reason why we do this is to avoid
   * having to re-fetch the values when the user is still editing the spec.
   */
  const previewSpec = form.getValues() as ListVariableDefinition;

  const plugin = useWatch<VariableDefinition, 'spec.plugin'>({ control, name: 'spec.plugin' });
  const kind = plugin?.kind;
  const pluginSpec = plugin?.spec;

  const _allowAllValue = useWatch<VariableDefinition, 'spec.allowAllValue'>({
    control: control,
    name: 'spec.allowAllValue',
  });

  const sortMethod = useWatch<VariableDefinition, 'spec.sort'>({
    control: control,
    name: 'spec.sort',
  }) as SortMethodName;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['variable', previewSpec] });
  }, [previewSpec, queryClient]);

  // When variable kind is selected we need to provide default values
  // TODO: check if react-hook-form has a better way to do this
  const values = form.getValues() as ListVariableDefinition;
  if (values.spec.allowAllValue === undefined) {
    form.setValue('spec.allowAllValue', false);
  }

  if (values.spec.allowMultiple === undefined) {
    form.setValue('spec.allowMultiple', false);
  }

  if (!values.spec.plugin) {
    form.setValue('spec.plugin', { kind: 'StaticListVariable', spec: {} });
  }

  if (!values.spec.sort) {
    form.setValue('spec.sort', 'none');
  }

  return (
    <>
      <Typography py={1} variant="subtitle1">
        List Options
      </Typography>
      <Stack spacing={2} mb={2}>
        <Box>
          <ErrorBoundary FallbackComponent={FallbackPreview} resetKeys={[previewSpec]}>
            <VariableListPreview sortMethod={sortMethod} definition={previewSpec} />
          </ErrorBoundary>
        </Box>
        <Stack>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <Controller
              control={control}
              name="spec.plugin"
              render={({ field }) => {
                return (
                  <PluginEditor
                    withRunQueryButton
                    width="100%"
                    pluginTypes={['Variable']}
                    pluginKindLabel="Source"
                    value={{
                      selection: {
                        type: 'Variable',
                        kind: kind ?? 'StaticListVariable',
                      },
                      spec: pluginSpec ?? {},
                    }}
                    isReadonly={action === 'read'}
                    onChange={(v) => {
                      field.onChange({ kind: v.selection.kind, spec: v.spec });
                    }}
                    onQueryRefresh={handleRefresh}
                  />
                );
              }}
            />
          </ErrorBoundary>
        </Stack>

        <Stack>
          <Controller
            control={control}
            name="spec.capturingRegexp"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Capturing Regexp Filter"
                InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                InputProps={{
                  readOnly: action === 'read',
                }}
                error={!!fieldState.error}
                value={field.value ?? ''}
                onChange={(event) => {
                  if (event.target.value === '') {
                    field.onChange(undefined);
                  } else {
                    field.onChange(event);
                  }
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
            control={control}
            name="spec.sort"
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
                value={field.value ?? 'none'}
                onChange={(event) => {
                  field.onChange(event);
                }}
              >
                {Object.keys(SORT_METHODS).map((key) => {
                  if (!SORT_METHODS[key as SortMethodName]) return null;
                  const { label } = SORT_METHODS[key as SortMethodName];
                  return (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  );
                })}
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
            control={control}
            name="spec.allowMultiple"
            render={({ field }) => (
              <FormControlLabel
                label="Allow Multiple Values"
                control={
                  <Switch
                    {...field}
                    checked={!!field.value}
                    readOnly={action === 'read'}
                    value={field.value ?? false}
                    onChange={(event) => {
                      if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                      field.onChange(event);
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
            control={control}
            name="spec.allowAllValue"
            render={({ field }) => (
              <FormControlLabel
                label="Allow All option"
                control={
                  <Switch
                    {...field}
                    checked={!!field.value}
                    readOnly={action === 'read'}
                    value={field.value ?? false}
                    onChange={(event) => {
                      if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                      field.onChange(event);
                    }}
                  />
                }
              />
            )}
          />
          <Typography mb={1} variant="caption">
            Enables an option to include all variable values
          </Typography>
          {_allowAllValue && (
            <Controller
              control={control}
              name="spec.customAllValue"
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
                  value={field.value ?? ''}
                  onChange={(event) => {
                    if (event.target.value === '') {
                      field.onChange(undefined);
                    } else {
                      field.onChange(event);
                    }
                  }}
                />
              )}
            />
          )}
        </Stack>
      </Stack>
    </>
  );
}

interface VariableEditorFormProps {
  initialVariableDefinition: VariableDefinition;
  action: Action;
  isDraft: boolean;
  isReadonly?: boolean;
  onActionChange?: (action: Action) => void;
  onSave: (def: VariableDefinition) => void;
  onClose: () => void;
  onDelete?: DispatchWithoutAction;
}

export function VariableEditorForm({
  initialVariableDefinition,
  action,
  isDraft,
  isReadonly,
  onActionChange,
  onSave,
  onClose,
  onDelete,
}: VariableEditorFormProps): ReactElement {
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);
  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const { variableEditorSchema } = useValidationSchemas();
  const form = useForm<VariableDefinition>({
    resolver: zodResolver(variableEditorSchema),
    mode: 'onBlur',
    defaultValues: initialVariableDefinition,
  });

  const kind = useWatch({ control: form.control, name: 'kind' });

  function clearFormData(data: VariableDefinition): VariableDefinition {
    const result = { ...data };
    if (
      result.spec.display?.name === undefined &&
      result.spec.display?.description === undefined &&
      result.spec.display?.hidden === undefined
    ) {
      delete result.spec.display;
    }
    return result;
  }

  const processForm: SubmitHandler<VariableDefinition> = (data: VariableDefinition) => {
    // reset display attributes to undefined when empty, because we don't want to save empty strings
    onSave(clearFormData(data));
  };

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel(): void {
    if (JSON.stringify(initialVariableDefinition) !== JSON.stringify(clearFormData(form.getValues()))) {
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
        <Typography variant="h2">{titleAction} Variable</Typography>
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
          <Grid item xs={8}>
            <Controller
              control={form.control}
              name="spec.name"
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
                  value={field.value ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={4}>
            <Controller
              control={form.control}
              name="spec.display.name"
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
              name="spec.display.description"
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
                  value={field.value ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={4}>
            <Controller
              control={form.control}
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
                  value={field.value ?? 'TextVariable'}
                  onChange={(event) => {
                    field.onChange(event);
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

        {kind === 'TextVariable' && (
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <TextVariableEditorForm action={action} control={form.control} />
          </ErrorBoundary>
        )}
        {kind === 'ListVariable' && (
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <ListVariableEditorForm action={action} control={form.control} />
          </ErrorBoundary>
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
