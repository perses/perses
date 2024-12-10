// Copyright 2024 The Perses Authors
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

import { Button, Divider, Stack, StackProps } from '@mui/material';
import { ReactElement } from 'react';
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
}: FormActionsProps): ReactElement {
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
