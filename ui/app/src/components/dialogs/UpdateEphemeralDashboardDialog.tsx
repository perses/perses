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
import {
  DashboardResource,
  DurationString,
  EphemeralDashboardResource,
  getDashboardDisplayName,
  getDashboardExtendedDisplayName,
} from '@perses-dev/core';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateEphemeralDashboardMutation } from '../../model/ephemeral-dashboard-client';
import {
  updateEphemeralDashboardDialogValidationSchema,
  UpdateEphemeralDashboardValidationType,
} from '../../validation';

interface UpdateEphemeralDashboardDialog {
  ephemeralDashboard: EphemeralDashboardResource;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to rename an ephemeral dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.ephemeralDashboard The ephemeral dashboard resource to rename.
 */
export const UpdateEphemeralDashboardDialog = (props: UpdateEphemeralDashboardDialog) => {
  const { ephemeralDashboard, open, onClose, onSuccess } = props;
  const form = useForm<UpdateEphemeralDashboardValidationType>({
    resolver: zodResolver(updateEphemeralDashboardDialogValidationSchema),
    mode: 'onBlur',
    defaultValues: {
      dashboardName: getDashboardDisplayName(ephemeralDashboard as unknown as DashboardResource),
      ttl: ephemeralDashboard.spec.ttl,
    },
  });
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateEphemeralDashboardMutation = useUpdateEphemeralDashboardMutation();

  const processForm: SubmitHandler<UpdateEphemeralDashboardValidationType> = (data) => {
    if (ephemeralDashboard.spec.display) {
      ephemeralDashboard.spec.display.name = data.dashboardName;
    } else {
      ephemeralDashboard.spec.display = { name: data.dashboardName };
    }
    ephemeralDashboard.spec.ttl = data.ttl as DurationString;

    updateEphemeralDashboardMutation.mutate(ephemeralDashboard, {
      onSuccess: (updatedEphemeralDashboard: EphemeralDashboardResource) => {
        successSnackbar(
          `Ephemeral dashboard ${getDashboardExtendedDisplayName(
            updatedEphemeralDashboard as unknown as DashboardResource
          )} has been successfully updated`
        );
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
    form.reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog" fullWidth={true}>
      <Dialog.Header>Update Ephemeral Dashboard</Dialog.Header>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(processForm)}>
          <Dialog.Content sx={{ width: '100%' }}>
            <Controller
              name="dashboardName"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  margin="dense"
                  id="name"
                  label="Name"
                  type="text"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="ttl"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  margin="dense"
                  id="name"
                  label="Time to live (TTL)"
                  type="text"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ? fieldState.error.message : 'Duration string like 1w, 3d12h..'}
                />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="contained" disabled={!form.formState.isValid} type="submit">
              Save
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </Dialog.Actions>
        </form>
      </FormProvider>
    </Dialog>
  );
};
