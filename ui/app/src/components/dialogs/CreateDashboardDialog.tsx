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
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardSelector } from '@perses-dev/core';
import { createDashboardDialogValidationSchema, CreateDashboardValidationType } from '../../validation';

interface CreateDashboardProps {
  open: boolean;
  projectOptions: string[];
  hideProjectSelect?: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<DashboardSelector>;
}

/**
 * Dialog used to create a dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.projectOptions The project where the dashboard will be created.
 * If it contains only one element, it will be used as project value and will hide the project selection.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 * @constructor
 */
export const CreateDashboardDialog = (props: CreateDashboardProps) => {
  const { open, projectOptions, hideProjectSelect, onClose, onSuccess } = props;

  const form = useForm<CreateDashboardValidationType>({
    resolver: zodResolver(createDashboardDialogValidationSchema),
    mode: 'onBlur',
    defaultValues: { dashboardName: '', projectName: projectOptions[0] },
  });

  const processForm: SubmitHandler<CreateDashboardValidationType> = (data) => {
    onClose();
    if (onSuccess) {
      onSuccess({ project: data.projectName, dashboard: data.dashboardName } as DashboardSelector);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };
  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog">
      <Dialog.Header>Create Dashboard</Dialog.Header>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(processForm)}>
          <Dialog.Content>
            <Stack gap={1}>
              {!hideProjectSelect && (
                <Controller
                  name="projectName"
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      {...field}
                      required
                      id="project"
                      label="Project name"
                      type="text"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    >
                      {projectOptions.map((option) => {
                        return (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  )}
                />
              )}
              {/* TODO: fix autofill when creating dashboard from project view */}
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
