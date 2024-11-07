import { Button, Divider, Stack, StackProps } from '@mui/material';
import React from 'react';
import { Action } from '@perses-dev/core';

export interface FormActionsProps extends StackProps {
  action: Action;
  submitText?: string;
  cancelText?: string;
  isReadonly?: boolean;
  isValid?: boolean;
  onActionChange?: (action: Action) => void;
  onSubmit?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export function FormActions({
  action,
  submitText = 'Save',
  cancelText = 'Cancel',
  isReadonly,
  isValid,
  onActionChange,
  onSubmit,
  onDelete,
  onCancel,
  ...props
}: FormActionsProps) {
  return (
    <Stack direction="row" gap={1} sx={{ marginLeft: 'auto' }} {...props}>
      {action === 'read' ? (
        <>
          {onActionChange && (
            <Button disabled={isReadonly} variant="contained" onClick={() => onActionChange('update')}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button color="error" disabled={isReadonly} variant="outlined" onClick={onDelete}>
              Delete
            </Button>
          )}
          {onCancel && (onSubmit || onDelete) && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                borderColor: (theme) => theme.palette.grey['500'],
                '&.MuiDivider-root': {
                  marginLeft: 2,
                  marginRight: 1,
                },
              }}
            />
          )}
          {onCancel && (
            <Button color="secondary" variant="outlined" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
        </>
      ) : (
        <>
          {onSubmit && (
            <Button variant="contained" disabled={!isValid} onClick={onSubmit}>
              {submitText}
            </Button>
          )}
          {onCancel && (
            <Button color="secondary" variant="outlined" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
