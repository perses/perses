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

import { Dispatch, DispatchWithoutAction, useCallback } from 'react';
import { Alert, Button } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { useSnackbar } from '../../context/SnackbarProvider';
import { useDeleteProjectMutation } from '../../model/project-client';
import { useIsReadonly } from '../../model/config-client';

export interface DeleteProjectDialogProps {
  name: string;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<string>;
}

/**
 * Dialog used to delete a project.
 *
 * @param props.name The name of the project to delete.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.onClose Callback executed when dialog is closed.
 * @param props.onSuccess Callback executed when deletion has been performed with success.
 * @constructor
 */
export const DeleteProjectDialog = (props: DeleteProjectDialogProps) => {
  const { name, open, onClose, onSuccess } = props;
  const isReadonly = useIsReadonly();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const mutation = useDeleteProjectMutation();

  const handleSubmit = useCallback(() => {
    return mutation.mutate(name, {
      onSuccess: (name: string) => {
        successSnackbar(`project ${name} was successfully deleted`);
        onClose();
        if (onSuccess) {
          onSuccess(name);
        }
      },
      onError: (err) => {
        exceptionSnackbar(err);
      },
    });
  }, [mutation, name, onClose, onSuccess, successSnackbar, exceptionSnackbar]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>Delete Project</Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the project <strong>{name}</strong>? This will delete all the dashboards within
        the project.
        {isReadonly && (
          <Alert severity={'warning'} sx={{ backgroundColor: 'transparent', padding: 0 }}>
            Project managed via code only.
          </Alert>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" type="submit" disabled={isReadonly} onClick={handleSubmit}>
          Delete
        </Button>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};
