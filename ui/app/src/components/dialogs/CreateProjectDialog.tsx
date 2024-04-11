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
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { getResourceDisplayName, ProjectResource } from '@perses-dev/core';
import { CreateProjectValidationType, useProjectValidationSchema } from '../../validation';
import { generateMetadataName } from '../../utils/metadata';
import { useCreateProjectMutation } from '../../model/project-client';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<ProjectResource>;
}

/**
 * Dialog used to create a project.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 */
export function CreateProjectDialog(props: CreateProjectDialogProps) {
  const { open, onClose, onSuccess } = props;
  const validationSchema = useProjectValidationSchema();

  const form = useForm<CreateProjectValidationType>({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
  });

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const mutation = useCreateProjectMutation();

  const processForm: SubmitHandler<CreateProjectValidationType> = (data) => {
    const name = generateMetadataName(data.projectName);

    mutation.mutate(
      { kind: 'Project', metadata: { name: name }, spec: { display: { name: data.projectName } } },
      {
        onSuccess: (entity: ProjectResource) => {
          successSnackbar(`Project ${getResourceDisplayName(entity)} was successfully created`);
          onClose();
          if (onSuccess) {
            onSuccess(entity);
          }
        },
        onError: (err: Error) => {
          exceptionSnackbar(err);
        },
      }
    );
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth={true}>
      <Dialog.Header>Add Project</Dialog.Header>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(processForm)}>
          <Dialog.Content sx={{ width: '100%' }}>
            <Controller
              name="projectName"
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="contained" type="submit" disabled={!form.formState.isValid}>
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
}
