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

import { Dispatch, DispatchWithoutAction } from 'react';
import { Button, TextField } from '@mui/material';
import { Dialog, useSnackbar } from '@perses-dev/components';
import { DashboardResource, getDashboardExtendedDisplayName } from '@perses-dev/core';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateDashboardMutation } from '../../model/dashboard-client';
import { renameDashboardDialogValidationSchema, RenameDashboardValidationType } from '../../validation';

interface RenameDashboardDialogProps {
  dashboard: DashboardResource;
  open: boolean;
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
  const { dashboard, open, onClose, onSuccess } = props;
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RenameDashboardValidationType>({
    resolver: zodResolver(renameDashboardDialogValidationSchema),
    mode: 'onBlur',
  });
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateDashboardMutation = useUpdateDashboardMutation();

  const processForm: SubmitHandler<RenameDashboardValidationType> = (data) => {
    if (dashboard.spec.display) {
      dashboard.spec.display.name = data.dashboardName;
    } else {
      dashboard.spec.display = { name: data.dashboardName };
    }

    updateDashboardMutation.mutate(dashboard, {
      onSuccess: (updatedDashboard: DashboardResource) => {
        successSnackbar(`Dashboard ${getDashboardExtendedDisplayName(updatedDashboard)} has been successfully updated`);
        onClose();
        if (onSuccess) {
          onSuccess(data.dashboardName);
        }
      },
      onError: (err) => {
        exceptionSnackbar(err);
        throw err;
      },
    });
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog">
      <Dialog.Header>Rename Dashboard</Dialog.Header>
      <form onSubmit={handleSubmit(processForm)}>
        <Dialog.Content>
          <TextField
            required
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            error={!!errors.dashboardName}
            helperText={errors.dashboardName?.message}
            {...register('dashboardName')}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="contained" disabled={!isValid} type="submit">
            Rename
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog>
  );
};
