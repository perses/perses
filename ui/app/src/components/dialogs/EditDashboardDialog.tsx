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

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Autocomplete, Button, Chip, CircularProgress, Stack, TextField } from '@mui/material';
import type { DashboardResource } from '@perses-dev/client';
import { Dialog, getResourceDisplayName, getResourceExtendedDisplayName, useSnackbar } from '@perses-dev/components';
import type { Dispatch, DispatchWithoutAction, ReactElement } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, FormProvider, useForm } from 'react-hook-form';

import { useDashboard, useUpdateDashboardMutation } from '../../model/dashboard-client';
import type { EditDashboardInput, EditDashboardValidationType } from '../../validation';
import { editDashboardDialogValidationSchema } from '../../validation';

interface EditDashboardDialogProps {
  project: string;
  name: string;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to edit a dashboard (name and tags).
 * The dashboard is fetched when the dialog opens, to make sure an up-to-date version is edited.
 * @param props.project The project of the dashboard to edit.
 * @param props.name The name of the dashboard to edit.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 */
export const EditDashboardDialog = (props: EditDashboardDialogProps): ReactElement => {
  const { project, name, open, onClose, onSuccess } = props;

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="confirm-dialog" fullWidth={true}>
      <Dialog.Header>Edit Dashboard</Dialog.Header>
      {/* Children are only mounted while the dialog is opened, so the dashboard is only fetched when needed */}
      <EditDashboardDialogContent project={project} name={name} onClose={onClose} onSuccess={onSuccess} />
    </Dialog>
  );
};

type EditDashboardDialogContentProps = Omit<EditDashboardDialogProps, 'open'>;

function EditDashboardDialogContent(props: EditDashboardDialogContentProps): ReactElement {
  const { project, name, onClose, onSuccess } = props;
  // Always refetch on mount and wait for it: a cached version of the dashboard may be outdated, and saving it would
  // overwrite a newer spec on the server.
  const {
    data: dashboard,
    error,
    isFetchedAfterMount,
  } = useDashboard(project, name, {
    refetchOnMount: 'always',
  });

  if (!isFetchedAfterMount) {
    return (
      <Dialog.Content sx={{ width: '100%' }}>
        <Stack alignItems="center" justifyContent="center">
          <CircularProgress />
        </Stack>
      </Dialog.Content>
    );
  }

  if (error || !dashboard) {
    return (
      <>
        <Dialog.Content sx={{ width: '100%' }}>
          <Alert severity="error">Failed to load the dashboard: {error?.message}</Alert>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Close
          </Button>
        </Dialog.Actions>
      </>
    );
  }

  return <EditDashboardForm dashboard={dashboard} onClose={onClose} onSuccess={onSuccess} />;
}

interface EditDashboardFormProps {
  dashboard: DashboardResource;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

function EditDashboardForm(props: EditDashboardFormProps): ReactElement {
  const { dashboard, onClose, onSuccess } = props;
  // The form is only mounted once the dashboard is loaded, so default values are always initialized from fresh data.
  const form = useForm<EditDashboardInput, unknown, EditDashboardValidationType>({
    resolver: zodResolver(editDashboardDialogValidationSchema),
    mode: 'onBlur',
    defaultValues: {
      dashboardName: getResourceDisplayName(dashboard),
      tags: dashboard.metadata.tags ?? [],
    },
  });
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateDashboardMutation = useUpdateDashboardMutation();

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

  return (
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
                        new Set(newValue.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0)),
                      ),
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
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Cancel
          </Button>
        </Dialog.Actions>
      </form>
    </FormProvider>
  );
}
