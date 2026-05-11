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

import { Dispatch, DispatchWithoutAction, ReactElement, useMemo } from 'react';
import { Autocomplete, Button, Chip, CircularProgress, Stack, TextField } from '@mui/material';
import { Dialog, useSnackbar } from '@perses-dev/components';
import { FolderResource, FolderSpec, getResourceDisplayName, getResourceExtendedDisplayName } from '@perses-dev/core';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateFolderValidationType, useFolderValidationSchema } from '../../validation';
import { useDashboardList } from '../../model/dashboard-client';
import { useCreateFolderMutation } from '../../model/folder-client';
import { generateMetadataName } from '../../utils/metadata';

export interface CreateFolderDialogProps {
  projectName: string;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to create a new root-level folder in a project.
 * @param open Define if the dialog should be opened or not.
 * @param onClose Provides the function to close itself.
 * @param onSuccess Action to perform when user confirmed.
 * @param projectName The project to create the folder in.
 */
export const CreateFolderDialog = ({
  projectName,
  open,
  onClose,
  onSuccess,
}: CreateFolderDialogProps): ReactElement => {
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const { data: dashboards } = useDashboardList({ project: projectName });
  const createFolderMutation = useCreateFolderMutation();
  const { schema, isSchemaLoading } = useFolderValidationSchema(projectName);

  const options = useMemo(
    () => [...(dashboards?.values() ?? [])].map((d) => ({ label: getResourceDisplayName(d), name: d.metadata.name })),
    [dashboards]
  );

  const form = useForm<CreateFolderValidationType>({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: 'onBlur',
    defaultValues: {
      selectedDashboards: [],
      name: '',
    },
  });
  const { reset } = form;

  const processForm: SubmitHandler<CreateFolderValidationType> = (data) => {
    const dashboardSpecs: FolderSpec[] = data.selectedDashboards.map((option) => ({
      kind: 'Dashboard' as const,
      name: option.name,
    }));
    const newFolder: FolderResource = {
      kind: 'Folder',
      metadata: {
        name: generateMetadataName(data.name),
        project: projectName,
      },
      spec: dashboardSpecs,
    };

    createFolderMutation.mutate(newFolder, {
      onSuccess: (createdFolder: FolderResource) => {
        successSnackbar(`Folder ${getResourceExtendedDisplayName(createdFolder)} has been successfully created`);
        onClose();
        reset();
        onSuccess?.(createdFolder.metadata.name);
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
      <Dialog.Header>Add Folder</Dialog.Header>
      {isSchemaLoading ? (
        <Stack
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <CircularProgress />
        </Stack>
      ) : (
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(processForm)}>
            <Dialog.Content sx={{ width: '100%' }}>
              <Stack spacing={2}>
                <Controller
                  render={({ field, fieldState }) => (
                    <TextField
                      label="Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      {...field}
                    />
                  )}
                  name="name"
                />
                <Controller
                  control={form.control}
                  name="selectedDashboards"
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={options}
                      getOptionLabel={(option) => option.label}
                      getOptionKey={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option.name === value.name}
                      value={field.value}
                      onChange={(_, newValue) => field.onChange(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip {...getTagProps({ index })} key={option.name} label={option.label} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Dashboards"
                          placeholder="Select dashboards"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
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
      )}
    </Dialog>
  );
};
