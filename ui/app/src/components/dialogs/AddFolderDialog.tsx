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
import { Autocomplete, Button, Chip, Stack, TextField } from '@mui/material';
import { Dialog, useSnackbar } from '@perses-dev/components';
import { getResourceExtendedDisplayName } from '@perses-dev/core';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderItem, FolderResource } from '../../model/folder';
import { EditFolderValidationType, useAddFolderValidationSchema } from '../../validation';
import { useUpdateFolderMutation } from '../../model/folder-client';
import { collectDashboards, insertSubFolder } from '../../utils/folderUtils';
import { DashboardListRow } from '../DashboardList/DashboardList';

export interface AddFolderDialogProps {
  folder: FolderResource;
  dashboards: Map<string, DashboardListRow>;
  open: boolean;
  path: string[];
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to add a new sub-folder under an existing folder.
 * @param open Define if the dialog should be opened or not.
 * @param onClose Provides the function to close itself.
 * @param onSuccess Action to perform when user confirmed.
 * @param folder The root folder resource.
 * @param dashboards The list of available dashboards to assign to the new folder.
 * @param path Path of folder names identifying the parent folder.
 */
export const AddFolderDialog = ({
  folder,
  dashboards,
  path,
  open,
  onClose,
  onSuccess,
}: AddFolderDialogProps): ReactElement => {
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateFolderMutation = useUpdateFolderMutation();
  const addFolderSchema = useAddFolderValidationSchema(folder.spec.items ?? [], path);

  const dashboardsInSiblingFolders: string[] = useMemo(
    () => collectDashboards(folder.spec.items, true),
    [folder.spec.items]
  );

  const options = useMemo(
    () =>
      [...dashboards.values()]
        .filter((s) => !dashboardsInSiblingFolders.includes(s.name))
        .map((d) => ({ label: d.displayName, name: d.name })),
    [dashboardsInSiblingFolders, dashboards]
  );

  const form = useForm<EditFolderValidationType>({
    resolver: zodResolver(addFolderSchema),
    mode: 'onBlur',
    defaultValues: {
      selectedDashboards: [],
      name: '',
    },
  });
  const { reset } = form;

  const processForm: SubmitHandler<EditFolderValidationType> = (data) => {
    const dashboardItems = data.selectedDashboards.map((option) => ({ kind: 'Dashboard' as const, name: option.name }));
    const newFolder: FolderItem = { kind: 'Folder', name: data.name, items: dashboardItems };
    const rootClone = structuredClone(folder);
    const updatedItems =
      path.length === 0
        ? [...(folder.spec.items ?? []), newFolder]
        : insertSubFolder(rootClone.spec.items ?? [], path, newFolder);

    updateFolderMutation.mutate(
      { ...folder, spec: { ...folder.spec, items: updatedItems } },
      {
        onSuccess: (updatedFolder: FolderResource) => {
          successSnackbar(`Folder ${getResourceExtendedDisplayName(updatedFolder)} has been successfully updated`);
          handleClose();
          onSuccess?.(updatedFolder.metadata.name);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      }
    );
  };

  const handleClose = (): void => {
    onClose();
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog" fullWidth={true}>
      <Dialog.Header>Add Folder</Dialog.Header>
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
    </Dialog>
  );
};
