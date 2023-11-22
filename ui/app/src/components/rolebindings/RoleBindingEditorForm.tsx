import { Action, RoleBinding } from '@perses-dev/core';
import {
  getSubmitText,
  getTitleAction,
  variableEditValidationSchema,
  VariableEditValidationType,
} from '@perses-dev/plugin-system';
import React, { DispatchWithoutAction, useState } from 'react';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { DiscardChangesConfirmationDialog } from '@perses-dev/components';
import { useImmer } from 'use-immer';
import { zodResolver } from '@hookform/resolvers/zod';

interface RoleBindingEditorFormProps {
  initialRoleBinding: RoleBinding;
  initialAction: Action;
  isDraft: boolean;
  isReadonly?: boolean;
  onSave: (def: RoleBinding) => void;
  onClose: () => void;
  onDelete?: DispatchWithoutAction;
}

export function RoleBindingEditorForm(props: RoleBindingEditorFormProps) {
  const { initialRoleBinding, initialAction, isDraft, isReadonly, onSave, onClose, onDelete } = props;

  const [state, setState] = useImmer(initialRoleBinding);
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);
  const [action, setAction] = useState(initialAction);

  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const form = useForm<VariableEditValidationType>({
    resolver: zodResolver(variableEditValidationSchema),
    mode: 'onBlur',
    defaultValues: state,
  });

  const processForm: SubmitHandler<VariableEditValidationType> = () => {
    onSave(state);
  };

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel() {
    if (JSON.stringify(initialRoleBinding) !== JSON.stringify(state)) {
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
                  draft.metadata.name = event.target.value;
                });
              }}
            />
          )}
        />
        <Divider />
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
