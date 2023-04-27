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

import { ChangeEvent, Dispatch, DispatchWithoutAction, useCallback, useState } from 'react';
import { Alert, Button, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { ProjectModel, useAddProjectMutation } from '../../model/project-client';
import { useSnackbar } from '../../context/SnackbarProvider';
import { useIsReadonly } from '../../model/config-client';

export interface AddProjectDialogProps {
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<ProjectModel>;
}

/**
 * Dialog used to create a project.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 * @constructor
 */
export const AddProjectDialog = (props: AddProjectDialogProps) => {
  const { open, onClose, onSuccess } = props;
  const isReadonly = useIsReadonly();

  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Called every time the user type in the form
  const handleNameFormChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      if (!e.target.value) {
        setError('Required');
      } else if (!/^[a-zA-Z0-9_.:-]+$/.exec(e.target.value)) {
        setError('Allowed special characters are _ . : -');
      } else {
        setError('');
      }
      // TODO: Verify the non-existence of the project, using a debounce (300ms?) to not call it too many
    },
    [setName, setError]
  );

  // Reinitialize form for next time the dialog is opened
  const handleNameFormReset = useCallback(() => {
    setName('');
    setError('');
  }, [setName, setError]);

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const mutation = useAddProjectMutation();
  const handleSubmit = useCallback(() => {
    mutation.mutate(name, {
      onSuccess: (entity: ProjectModel) => {
        successSnackbar(`project ${entity.metadata.name} was successfully created`);
        onClose();
        if (onSuccess) {
          onSuccess(entity);
        }
      },
      onError: (err) => {
        exceptionSnackbar(err);
      },
      onSettled: () => {
        handleNameFormReset();
      },
    });
  }, [mutation, name, successSnackbar, exceptionSnackbar, onSuccess, onClose, handleNameFormReset]);

  const handleClose = useCallback(() => {
    onClose();
    handleNameFormReset();
  }, [onClose, handleNameFormReset]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <Dialog.Header>Add Project</Dialog.Header>
      <Dialog.Content>
        <TextField
          required
          margin="dense"
          id="name"
          label="Name"
          type="text"
          fullWidth
          onChange={handleNameFormChange}
          value={name}
          error={!!error}
          helperText={error}
        />
        {isReadonly && (
          <Alert severity={'warning'} sx={{ backgroundColor: 'transparent', padding: 0 }}>
            Project managed via code only.
          </Alert>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" type="submit" disabled={!!error || isReadonly} onClick={handleSubmit}>
          Add
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};
