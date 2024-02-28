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

import { Dispatch, DispatchWithoutAction } from 'react';
import { Button, Stack, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EphemeralDashboardInfo } from '@perses-dev/core';
import { CreateEphemeralDashboardValidationType, useEphemeralDashboardValidationSchema } from '../../validation';

interface CreateEphemeralDashboardProps {
  open: boolean;
  projectOptions: string[];
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<EphemeralDashboardInfo>;
}

/**
 * Dialog used to create an ephemeral dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.projectOptions The project where the ephemeral dashboard will be created.
 * If it contains only one element, it will be used as project value and will hide the project selection.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 */
export const CreateEphemeralDashboardDialog = (props: CreateEphemeralDashboardProps) => {
  const { open, projectOptions, onClose, onSuccess } = props;

  const schemaValidation = useEphemeralDashboardValidationSchema();

  const form = useForm<CreateEphemeralDashboardValidationType>({
    resolver: zodResolver(schemaValidation),
    mode: 'onBlur',
    defaultValues: { dashboardName: '', projectName: projectOptions[0] },
  });

  const processForm: SubmitHandler<CreateEphemeralDashboardValidationType> = (data) => {
    onClose();
    if (onSuccess) {
      onSuccess({
        project: data.projectName,
        dashboard: data.dashboardName,
        ttl: data.ttl,
      } as EphemeralDashboardInfo);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };
  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog" fullWidth={true}>
      <Dialog.Header>Create Ephemeral Dashboard</Dialog.Header>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(processForm)}>
          <Dialog.Content sx={{ width: '100%' }}>
            <Stack gap={1}>
              <Controller
                name="dashboardName"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    required
                    margin="dense"
                    id="name"
                    label="Dashboard Name"
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
                    helperText={
                      fieldState.error?.message ? fieldState.error.message : 'Duration string like 1w, 3d12h..'
                    }
                  />
                )}
              />
            </Stack>
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="contained" disabled={!form.formState.isValid} type="submit">
              Add
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
