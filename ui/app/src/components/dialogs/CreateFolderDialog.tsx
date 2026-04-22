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

import { Dispatch, DispatchWithoutAction, ReactElement, useCallback } from 'react';
import { Button, CircularProgress, MenuItem, Stack, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { ProjectResource, getResourceDisplayName } from '@perses-dev/core';

interface CreateFolderProps {
  open: boolean;
  projects: ProjectResource[];
  hideProjectSelect?: boolean;
  mode?: 'create' | 'duplicate';
  name?: string;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<FolderSelector>;
}

export interface CreateFolderValidationType {
  projectName: string;
  folderName: string;
}

export interface FolderSelector {
  project: string;
  folder: string;
}

/**
 * Dialog used to create a folder.
 */
export const CreateFolderDialog = (props: CreateFolderProps): ReactElement => {
  const { open, projects, hideProjectSelect, mode, name, onClose, onSuccess } = props;

  const action = mode === 'duplicate' ? 'Duplicate' : 'Create';

  // Disables closing on click out
  const handleClickOut = (): void => {
    /* do nothing */
  };

  return (
    <Dialog open={open} onClose={handleClickOut} aria-labelledby="confirm-dialog" fullWidth={true}>
      <Dialog.Header>
        {action} Folder{name && ': ' + name}
      </Dialog.Header>
      <FolderForm {...{ projects, hideProjectSelect, onClose, onSuccess }} />
    </Dialog>
  );
};

interface FolderFormProps {
  projects: ProjectResource[];
  hideProjectSelect?: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<FolderSelector>;
}

const FolderForm = (props: FolderFormProps): ReactElement => {
  const { projects, hideProjectSelect, onClose, onSuccess } = props;

  // If you had a schema you could plug it here with zodResolver
  const folderForm = useForm<CreateFolderValidationType>({
    mode: 'onBlur',
    defaultValues: { folderName: '', projectName: projects[0]?.metadata.name ?? '' },
  });

  const handleProcessFolderForm = useCallback((): SubmitHandler<CreateFolderValidationType> => {
    return (data) => {
      onClose();
      if (onSuccess) {
        onSuccess({ project: data.projectName, folder: data.folderName });
      }
    };
  }, [onClose, onSuccess]);

  const handleClose = (): void => {
    onClose();
    folderForm.reset();
  };

  if (!projects || projects.length === 0) {
    return (
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
    );
  }

  return (
    <FormProvider {...folderForm}>
      <form onSubmit={folderForm.handleSubmit(handleProcessFolderForm())}>
        <Dialog.Content sx={{ width: '100%' }}>
          <Stack gap={1}>
            {!hideProjectSelect && (
              <Controller
                control={folderForm.control}
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
                    {projects.map((option) => {
                      return (
                        <MenuItem key={option.metadata.name} value={option.metadata.name}>
                          {getResourceDisplayName(option)}
                        </MenuItem>
                      );
                    })}
                  </TextField>
                )}
              />
            )}
            <Controller
              control={folderForm.control}
              name="folderName"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  margin="dense"
                  id="name"
                  label="Folder Name"
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
          <Button variant="contained" disabled={!folderForm.formState.isValid} type="submit">
            Add
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Dialog.Actions>
      </form>
    </FormProvider>
  );
};
