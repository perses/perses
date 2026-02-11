// Copyright The Perses Authors
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

import { Dispatch, DispatchWithoutAction, ReactElement, useEffect } from 'react';
import { Autocomplete, Button, Chip, Stack, TextField } from '@mui/material';
import { Dialog, useSnackbar } from '@perses-dev/components';
import { DashboardResource, getResourceDisplayName, getResourceExtendedDisplayName } from '@perses-dev/core';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateDashboardMutation } from '../../model/dashboard-client';
import { editDashboardDialogValidationSchema, EditDashboardValidationType } from '../../validation';

interface EditDashboardDialogProps {
  dashboard: DashboardResource;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to edit a dashboard (name and tags).
 * @param props.open Define if the dialog should be opened or not.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 * @param props.dashboard The dashboard resource to edit.
 */
export const EditDashboardDialog = (props: EditDashboardDialogProps): ReactElement => {
  const { dashboard, open, onClose, onSuccess } = props;
  const form = useForm<EditDashboardValidationType>({
    resolver: zodResolver(editDashboardDialogValidationSchema),
    mode: 'onBlur',
    defaultValues: {
      dashboardName: getResourceDisplayName(dashboard),
      tags: dashboard.metadata.tags ?? [],
    },
  });
  const { reset } = form;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateDashboardMutation = useUpdateDashboardMutation();

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      dashboardName: getResourceDisplayName(dashboard),
      tags: dashboard.metadata.tags ?? [],
    });
  }, [dashboard, open, reset]);

  const processForm: SubmitHandler<EditDashboardValidationType> = (data) => {
    const updatedDashboard: DashboardResource = {
      ...dashboard,
      metadata: {
        ...dashboard.metadata,
        tags: data.tags,
      },
      spec: {
        ...dashboard.spec,
        display: {
          ...dashboard.spec.display,
          name: data.dashboardName,
        },
      },
    };

    updateDashboardMutation.mutate(updatedDashboard, {
      onSuccess: (updatedDashboard: DashboardResource) => {
        successSnackbar(`Dashboard ${getResourceExtendedDisplayName(updatedDashboard)} has been successfully updated`);
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

  const handleClose = (): void => {
    onClose();
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog" fullWidth={true}>
      <Dialog.Header>Edit Dashboard</Dialog.Header>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(processForm)}>
          <Dialog.Content sx={{ width: '100%' }}>
            <Stack spacing={2}>
              <Controller
                control={form.control}
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
                control={form.control}
                name="tags"
                render={({ field, fieldState }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    freeSolo
                    options={[]}
                    value={field.value ?? []}
                    onChange={(_, newValue) =>
                      field.onChange(
                        Array.from(
                          new Set(newValue.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0))
                        )
                      )
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
                      ))
                    }
                    renderInput={(params) => {
                      const combinedInputProps = {
                        ...params.inputProps,
                        maxLength: 50,
                      };
                      return (
                        <TextField
                          {...params}
                          label="Tags"
                          placeholder="Type a tag and press Enter"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          inputProps={combinedInputProps}
                        />
                      );
                    }}
                  />
                )}
              />
            </Stack>
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
