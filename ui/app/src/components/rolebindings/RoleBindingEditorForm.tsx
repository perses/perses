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

import { Action, RoleBinding } from '@perses-dev/core';
import { getSubmitText, getTitleAction } from '@perses-dev/plugin-system';
import React, { DispatchWithoutAction, useMemo, useState } from 'react';
import { Controller, FormProvider, SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { Autocomplete, Box, Button, Divider, IconButton, Stack, TextField, Typography } from '@mui/material';
import { DiscardChangesConfirmationDialog } from '@perses-dev/components';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  roleBindingsEditorValidationSchema,
  RoleBindingsEditorValidationType,
} from '@perses-dev/plugin-system/dist/validation/rolebinding';
import PlusIcon from 'mdi-material-ui/Plus';
import MinusIcon from 'mdi-material-ui/Minus';
import { useUserList } from '../../model/user-client';

interface RoleBindingEditorFormProps {
  initialRoleBinding: RoleBinding;
  initialAction: Action;
  roleSuggestions: string[];
  isDraft: boolean;
  isReadonly?: boolean;
  onSave: (def: RoleBinding) => void;
  onClose: () => void;
  onDelete?: DispatchWithoutAction;
}

export function RoleBindingEditorForm(props: RoleBindingEditorFormProps) {
  const { initialRoleBinding, initialAction, roleSuggestions, isDraft, isReadonly, onSave, onClose, onDelete } = props;

  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);
  const [action, setAction] = useState(initialAction);

  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const form = useForm<RoleBindingsEditorValidationType>({
    resolver: zodResolver(roleBindingsEditorValidationSchema),
    mode: 'onBlur',
    defaultValues: initialRoleBinding,
  });

  const processForm: SubmitHandler<RoleBindingsEditorValidationType> = (data: RoleBinding) => {
    onSave(data);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'spec.subjects',
  });

  const { data: users } = useUserList();
  const usernames = useMemo(() => {
    return (users ?? []).map((user) => user.metadata.name);
  }, [users]);

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel() {
    if (JSON.stringify(initialRoleBinding) !== JSON.stringify(form.getValues())) {
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
        <Typography variant="h2">{titleAction} Role Binding</Typography>
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
      <Stack padding={2} gap={2} sx={{ overflowY: 'scroll' }}>
        <Stack gap={2} direction="row">
          <Controller
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
          <Controller
            name="spec.role"
            render={({ field, fieldState }) => (
              <Autocomplete
                {...field}
                disablePortal
                freeSolo
                options={roleSuggestions}
                fullWidth
                readOnly={action !== 'create'} // Role of a Role Binding can't be updated
                onChange={(_, data) => {
                  field.onChange(data);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Role"
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                    }}
                  />
                )}
              />
            )}
          />
        </Stack>
        <Divider />
        <Stack gap={1}>
          <Typography variant="h1" mb={2}>
            Subjects
          </Typography>
          {fields && fields.length > 0 ? (
            fields.map((field, index) => (
              <Stack key={field.id} direction="row" gap={1}>
                <Controller
                  name={`spec.subjects.${index}.name`}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      {...field}
                      disablePortal
                      freeSolo
                      options={usernames}
                      fullWidth
                      readOnly={action === 'read'}
                      onChange={(_, data) => {
                        field.onChange(data);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Username"
                          required
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          onChange={(event) => {
                            field.onChange(event.target.value);
                          }}
                        />
                      )}
                    />
                  )}
                />
                <IconButton
                  disabled={isReadonly || action === 'read'}
                  style={{ width: 'fit-content', height: 'fit-content' }}
                  onClick={() => remove(index)}
                >
                  <MinusIcon />
                </IconButton>
              </Stack>
            ))
          ) : (
            <Typography variant="subtitle1" mb={2} fontStyle="italic">
              No subject defined
            </Typography>
          )}
          <IconButton
            disabled={isReadonly || action === 'read'}
            style={{ width: 'fit-content', height: 'fit-content' }}
            // Add a new subject
            onClick={() => append({ kind: 'User', name: '' })}
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
