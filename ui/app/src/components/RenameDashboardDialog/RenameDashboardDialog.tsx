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
import { Alert, Button, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { DashboardResource, dashboardDisplayName, dashboardExtendedDisplayName } from '@perses-dev/core';
import { useSnackbar } from '../../context/SnackbarProvider';
import { useUpdateDashboardMutation } from '../../model/dashboard-client';

export interface RenameDashboardDialogProps {
  dashboard: DashboardResource;
  open: boolean;
  isReadonly?: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to rename a dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.dashboard The dashboard resource to rename.
 * @constructor
 */
export const RenameDashboardDialog = (props: RenameDashboardDialogProps) => {
  const { dashboard, open, isReadonly, onClose, onSuccess } = props;
  const [name, setName] = useState<string>();
  const [error, setError] = useState<string>();

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateDashboardMutation = useUpdateDashboardMutation();

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
    if (!name) {
      return;
    }
    if (dashboard.spec.display) {
      dashboard.spec.display.name = name;
    } else {
      dashboard.spec.display = { name: name };
    }

    updateDashboardMutation.mutate(dashboard, {
      onSuccess: (updatedDashboard: DashboardResource) => {
        successSnackbar(`Dashboard ${dashboardExtendedDisplayName(updatedDashboard)} has been successfully updated`);
        onClose();
        if (onSuccess) {
          onSuccess(name);
        }
        resetForm();
      },
      onError: (err) => {
        exceptionSnackbar(err);
        throw err;
      },
    });
  }, [dashboard, exceptionSnackbar, name, onClose, onSuccess, resetForm, successSnackbar, updateDashboardMutation]);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog">
      <Dialog.Header>Rename Dashboard</Dialog.Header>
      <Dialog.Content>
        <TextField
          required
          margin="dense"
          id="name"
          label="Name"
          type="text"
          fullWidth
          onChange={handleChange}
          defaultValue={dashboardDisplayName(dashboard)}
          value={name}
          error={!!error}
          helperText={error}
        />
        {isReadonly && (
          <Alert severity={'warning'} sx={{ backgroundColor: 'transparent', padding: 0 }}>
            Dashboard managed via code only.
          </Alert>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" disabled={!!error || isReadonly} onClick={handleSubmit}>
          Rename
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};
