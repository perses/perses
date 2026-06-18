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
import { Autocomplete, Button, Chip, Stack, TextField } from '@mui/material';
import { FolderItem, FolderResource } from '@perses-dev/client';
import { Dialog, getResourceDisplayName, getResourceExtendedDisplayName, useSnackbar } from '@perses-dev/components';
import { Dispatch, DispatchWithoutAction, ReactElement, useMemo } from 'react';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import { useUpdateFolderMutation } from '../../model/folder-client';
import { collectDashboards, getSubFolderDeepCopy, replaceSubFolder } from '../../utils/folderUtils';
import { editFolderDialogValidationSchema, EditFolderValidationType } from '../../validation';
import { DashboardListRow } from '../DashboardList/DashboardList';

export interface EditFolderDialogProps {
  folder: FolderResource;
  dashboards: Map<string, DashboardListRow>;
  open: boolean;
  path: string[];
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to edit a folder: rename it, set a display name, and reassign dashboards.
 * @param open Define if the dialog should be opened or not.
 * @param onClose Provides the function to close itself.
 * @param onSuccess Action to perform when user confirmed.
 * @param folder The root folder resource.
 * @param dashboards Map of available dashboards for edited folder
 * @param path Path of folder names leading to the folder being edited.
 */
export const EditFolderDialog = ({
  folder,
  dashboards,
  path,
  open,
  onClose,
  onSuccess,
}: EditFolderDialogProps): ReactElement => {
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateFolderMutation = useUpdateFolderMutation();

  const { folderToEdit, editingRoot } = useMemo(():
    | { folderToEdit: FolderResource; editingRoot: true }
    | { folderToEdit: FolderItem; editingRoot: false } => {
    const editingRoot = path.length === 0;
    if (editingRoot) {
      return { folderToEdit: structuredClone(folder), editingRoot };
    } else {
      const subFolder = getSubFolderDeepCopy(folder.spec.items ?? [], path);
      return { folderToEdit: subFolder, editingRoot };
    }
  }, [folder, path]);

  const dashboardNamesInFolder: string[] = useMemo(() => {
    return collectDashboards(editingRoot ? folderToEdit.spec.items : folderToEdit.items, false);
  }, [editingRoot, folderToEdit]);

  const dashboardsInSiblingFolders: string[] = useMemo(
    () => collectDashboards(folder.spec.items, true, (name) => !dashboardNamesInFolder.includes(name)),
    [dashboardNamesInFolder, folder.spec.items]
  );

  const options = useMemo(
    () =>
      [...dashboards.values()]
        .filter((s) => !dashboardsInSiblingFolders.includes(s.name))
        .map((d) => ({ label: d.displayName, name: d.name })),
    [dashboardsInSiblingFolders, dashboards]
  );

  const form = useForm<EditFolderValidationType>({
    resolver: zodResolver(editFolderDialogValidationSchema),
    mode: 'onBlur',
    defaultValues: {
      selectedDashboards: dashboardNamesInFolder.map((name) => ({
        name,
        label: dashboards.get(name)?.displayName,
      })),
      name: editingRoot ? getResourceDisplayName(folderToEdit) : folderToEdit.name,
    },
  });
  const { reset } = form;

  const processForm: SubmitHandler<EditFolderValidationType> = (data) => {
    const dashboardItems = data.selectedDashboards.map((option) => ({ kind: 'Dashboard' as const, name: option.name }));

    let updatedFolder: FolderResource;
    if (editingRoot) {
      const nonDashboardItems = folderToEdit.spec.items?.filter((s) => s.kind !== 'Dashboard') ?? [];
      updatedFolder = {
        ...folderToEdit,
        spec: {
          display: { name: data.name },
          items: [...nonDashboardItems, ...dashboardItems],
        },
      };
    } else {
      const nonDashboardItems = (folderToEdit.items ?? []).filter((s) => s.kind !== 'Dashboard');
      const updatedNode: FolderItem = {
        ...folderToEdit,
        name: data.name,
        items: [...nonDashboardItems, ...dashboardItems],
      };
      const rootFolderClone = { ...folder };
      rootFolderClone.spec = {
        ...rootFolderClone.spec,
        items: replaceSubFolder(rootFolderClone.spec.items ?? [], path, updatedNode),
      };
      updatedFolder = rootFolderClone;
    }

    updateFolderMutation.mutate(updatedFolder, {
      onSuccess: (updatedFolder: FolderResource) => {
        successSnackbar(`Folder ${getResourceExtendedDisplayName(updatedFolder)} has been successfully updated`);
        onClose();
        onSuccess?.(updatedFolder.metadata.name);
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
      <Dialog.Header>Edit Folder</Dialog.Header>
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
