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

import { Action, ACTIONS, GLOBAL_SCOPES, PROJECT_SCOPES, Role, rolesEditorSchema } from '@perses-dev/core';
import { getSubmitText, getTitleAction } from '@perses-dev/plugin-system';
import React, { Fragment, useMemo, useState } from 'react';
import { Control, Controller, FormProvider, SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Box, Divider, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DiscardChangesConfirmationDialog, FormActions } from '@perses-dev/components';
import { zodResolver } from '@hookform/resolvers/zod';
import PlusIcon from 'mdi-material-ui/Plus';
import MinusIcon from 'mdi-material-ui/Minus';
import { FormEditorProps } from '../form-drawers';

type RoleEditorFormProps = FormEditorProps<Role>;

export function RoleEditorForm({
  initialValue,
  action,
  isDraft,
  isReadonly,
  onActionChange,
  onSave,
  onClose,
  onDelete,
}: RoleEditorFormProps) {
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);

  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const form = useForm<Role>({
    resolver: zodResolver(rolesEditorSchema),
    mode: 'onBlur',
    defaultValues: initialValue,
  });

  const processForm: SubmitHandler<Role> = (data: Role) => {
    onSave(data);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'spec.permissions',
  });

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel() {
    if (JSON.stringify(initialValue) !== JSON.stringify(form.getValues())) {
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
        <Typography variant="h2">{titleAction} Role</Typography>
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
            Permissions
          </Typography>
          {fields && fields.length > 0 ? (
            fields.map((field, index) => (
              <Fragment key={field.id}>
                <Stack key={field.id} direction="row" gap={1} alignItems="end">
                  <PermissionControl control={form.control} index={index} action={action} />
                  <IconButton
                    disabled={isReadonly || action === 'read'}
                    style={{ width: 'fit-content', height: 'fit-content' }}
                    onClick={() => remove(index)}
                  >
                    <MinusIcon />
                  </IconButton>
                </Stack>
                <Divider />
              </Fragment>
            ))
          ) : (
            <Typography variant="subtitle1" mb={2} fontStyle="italic">
              No permission defined
            </Typography>
          )}
          <IconButton
            disabled={isReadonly || action === 'read'}
            style={{ width: 'fit-content', height: 'fit-content' }}
            // Add a new subject
            onClick={() => append({ actions: ['read'], scopes: ['*'] })}
          >
            <PlusIcon />
          </IconButton>
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

interface PermissionControl {
  control: Control<Role>;
  index: number;
  action: Action;
}

function PermissionControl({ control, index, action }: PermissionControl) {
  const kind = useWatch({ control, name: 'kind' });
  // Role and GlobalRole don't have same scopes
  const availableScopes = useMemo(() => {
    if (kind === 'Role') {
      return PROJECT_SCOPES;
    } else {
      // Else GlobalRole
      return PROJECT_SCOPES.concat(GLOBAL_SCOPES).sort();
    }
  }, [kind]);

  return (
    <Stack direction="row" width="100%" gap={2}>
      <Stack gap={1} width="100%">
        <Typography variant="h3" textTransform="capitalize">
          Actions
        </Typography>

        <Controller
          control={control}
          name={`spec.permissions.${index}.actions`}
          render={({ field, fieldState }) => (
            <TextField
              select
              {...field}
              required
              fullWidth
              label="Actions"
              InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
              InputProps={{
                readOnly: action === 'read',
              }}
              SelectProps={{
                multiple: true,
              }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);
              }}
            >
              {ACTIONS.map((actionOption: string) => (
                <MenuItem key={`actionOption-${actionOption}`} value={actionOption}>
                  {actionOption}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>
      <Stack gap={1} width="100%">
        <Typography variant="h3" textTransform="capitalize">
          Scopes
        </Typography>

        <Controller
          control={control}
          name={`spec.permissions.${index}.scopes`}
          render={({ field, fieldState }) => (
            <TextField
              select
              {...field}
              required
              fullWidth
              label="Scopes"
              InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
              InputProps={{
                readOnly: action === 'read',
              }}
              SelectProps={{
                multiple: true,
              }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);
              }}
            >
              {availableScopes.map((scopeOption: string) => (
                <MenuItem key={`scopeAction-${scopeOption}`} value={scopeOption}>
                  {scopeOption}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>
    </Stack>
  );
}
