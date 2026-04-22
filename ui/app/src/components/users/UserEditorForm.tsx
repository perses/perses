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

import { Action, UserEditorSchemaType, UserResource, userSchema } from '@perses-dev/core';
import { getSubmitText, getTitleAction } from '@perses-dev/plugin-system';
import React, { Fragment, ReactElement, useMemo, useState } from 'react';
import { Control, Controller, FormProvider, SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { Alert, Box, Divider, FormControl, IconButton, Stack, TextField, Typography } from '@mui/material';
import { DiscardChangesConfirmationDialog, FormActions } from '@perses-dev/components';
import { zodResolver } from '@hookform/resolvers/zod';
import MinusIcon from 'mdi-material-ui/Minus';
import PlusIcon from 'mdi-material-ui/Plus';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { useIsExternalProviderEnabled, useIsNativeProviderEnabled } from '../../context/Config';
import { FormEditorProps } from '../form-drawers';

type UserEditorFormProps = FormEditorProps<UserResource>;

export function UserEditorForm({
  initialValue,
  action,
  isDraft,
  isReadonly,
  onActionChange,
  onSave,
  onClose,
  onDelete,
}: UserEditorFormProps): ReactElement {
  const externalProvidersEnabled = useIsExternalProviderEnabled();
  const nativeProviderEnabled = useIsNativeProviderEnabled();

  // Reset all attributes that are "hidden" by the API and are returning <secret> as value
  const initialUserClean: UserResource = useMemo(() => {
    const result = { ...initialValue };
    if (result.spec.nativeProvider?.password) result.spec.nativeProvider.password = '';
    if (result.spec.oauthProviders === undefined) result.spec.oauthProviders = [];
    return result;
  }, [initialValue]);

  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);

  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const form = useForm<UserEditorSchemaType>({
    resolver: zodResolver(userSchema),
    mode: 'onBlur',
    defaultValues: initialUserClean,
  });

  const { spec } = form.watch();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'spec.oauthProviders',
  });

  const processForm: SubmitHandler<UserEditorSchemaType> = (data: UserResource) => {
    onSave(data);
  };

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel(): void {
    if (JSON.stringify(initialUserClean) !== JSON.stringify(form.getValues())) {
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
        <Typography variant="h2">{titleAction} User</Typography>
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
      <Stack padding={2} gap={2} sx={{ overflowY: 'scroll' }}>
        <Stack gap={2} direction="row">
          <Controller
            control={form.control}
            name="metadata.name"
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
                }}
              />
            )}
          />
        </Stack>
        <Divider />
        <Stack gap={1}>
          <Typography variant="h1" mb={2}>
            General
          </Typography>
          <FormControl>
            <Stack gap={2} direction="row">
              <Controller
                control={form.control}
                name="spec.firstName"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="First Name"
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                    }}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="spec.lastName"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Last Name"
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                    }}
                  />
                )}
              />
            </Stack>
          </FormControl>
        </Stack>
        <Divider />
        <Stack gap={1}>
          <Typography variant="h1" mb={2}>
            Native Provider
          </Typography>
          {spec.nativeProvider?.password === undefined ? (
            <IconButton
              disabled={isReadonly || action === 'read'}
              style={{ width: 'fit-content', height: 'fit-content' }}
              onClick={() => form.setValue('spec.nativeProvider', { password: '' })}
              title="Add native provider"
            >
              <PlusIcon />
            </IconButton>
          ) : (
            <Stack gap={2}>
              {!nativeProviderEnabled && (
                <Alert severity="warning">Native provider is currently disabled in the config!</Alert>
              )}
              <Stack direction="row" gap={1} alignItems="end">
                <Controller
                  control={form.control}
                  name="spec.nativeProvider.password"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Password"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
                <IconButton
                  disabled={isReadonly || action === 'read'}
                  style={{ width: 'fit-content', height: 'fit-content' }}
                  onClick={() => form.setValue('spec.nativeProvider', { password: undefined })}
                  title="Remove native provider"
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Stack>
          )}
        </Stack>
        <Divider />
        <Stack gap={1}>
          <Typography variant="h1" mb={2}>
            OAuth & OIDC Providers
          </Typography>
          {!externalProvidersEnabled && (
            <Alert severity="warning">No OAuth or OIDC providers are currently enabled in the config!</Alert>
          )}
          <Stack gap={2}>
            {fields && fields.length > 0 ? (
              fields.map((field, index) => (
                <Fragment key={field.id}>
                  <Stack key={field.id} direction="row" gap={1} alignItems="end">
                    <OAuthProvider control={form.control} index={index} action={action} />
                    <IconButton
                      disabled={isReadonly || action === 'read'}
                      style={{ width: 'fit-content', height: 'fit-content' }}
                      onClick={() => remove(index)}
                      title="Remove provider"
                    >
                      <MinusIcon />
                    </IconButton>
                  </Stack>
                </Fragment>
              ))
            ) : (
              <Typography variant="subtitle1" mb={2} fontStyle="italic">
                No OAuth or OIDC provider defined
              </Typography>
            )}
            <IconButton
              disabled={isReadonly || action === 'read'}
              style={{ width: 'fit-content', height: 'fit-content' }}
              onClick={() => append({ issuer: '', email: '', subject: '' })}
              title="Add OIDC or OAuth provider"
            >
              <PlusIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
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

function OAuthProvider({
  control,
  index,
  action,
}: {
  control: Control<UserResource>;
  index: number;
  action: Action;
}): ReactElement {
  return (
    <Stack direction="row" width="100%" gap={2}>
      <Stack gap={1} width="100%">
        <Typography variant="h3" textTransform="capitalize">
          Issuer
        </Typography>

        <Controller
          control={control}
          name={`spec.oauthProviders.${index}.issuer`}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              label="Issuer"
              InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
              InputProps={{
                readOnly: action === 'read',
              }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);
              }}
            />
          )}
        />
      </Stack>
      <Stack gap={1} width="100%">
        <Typography variant="h3" textTransform="capitalize">
          Email
        </Typography>

        <Controller
          control={control}
          name={`spec.oauthProviders.${index}.email`}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              label="Email"
              InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
              InputProps={{
                readOnly: action === 'read',
              }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);
              }}
            />
          )}
        />
      </Stack>
      <Stack gap={1} width="100%">
        <Typography variant="h3" textTransform="capitalize">
          Subject
        </Typography>

        <Controller
          control={control}
          name={`spec.oauthProviders.${index}.subject`}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              label="Subject"
              InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
              InputProps={{
                readOnly: action === 'read',
              }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);
              }}
            />
          )}
        />
      </Stack>
    </Stack>
  );
}
