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

import { ChangeEvent, Dispatch, DispatchWithoutAction, useCallback, useState } from 'react';
import { Button, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';

export interface CreateDashboardDialogProps {
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to create a dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.projectName The project where the dashboard will be created.
 * @constructor
 */
export const CreateDashboardDialog = (props: CreateDashboardDialogProps) => {
  const { open, onClose, onSuccess } = props;
  const [name, setName] = useState<string>();
  const [error, setError] = useState<string>();

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!e.target.value) {
      setError('Required');
    } else {
      setError(undefined);
    }
  }, []);

  // Reinitialize form for next time the dialog is opened
  const resetForm = useCallback(() => {
    setName(undefined);
    setError(undefined);
  }, []);

  const handleSubmit = useCallback(() => {
    if (name) {
      onClose();
      if (onSuccess) {
        onSuccess(name);
      }
      resetForm();
    }
  }, [name, onClose, onSuccess, resetForm]);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog">
      <Dialog.Header>Create Dashboard</Dialog.Header>
      <Dialog.Content>
        <TextField
          required
          margin="dense"
          id="name"
          label="Name"
          type="text"
          fullWidth
          onChange={handleChange}
          value={name}
          error={!!error}
          helperText={error}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" disabled={!!error} onClick={handleSubmit}>
          Add
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};
