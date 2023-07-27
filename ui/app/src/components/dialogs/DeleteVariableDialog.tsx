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

import { getVariableExtendedDisplayName, VariableResource } from '@perses-dev/core';
import { Dispatch, DispatchWithoutAction, useCallback } from 'react';
import { Dialog, useSnackbar } from '@perses-dev/components';
import { Button } from '@mui/material';
import { useDeleteVariableMutation } from '../../model/project-client';

interface DeleteVariableDialogProps {
  variable: VariableResource;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<VariableResource>;
}

/**
 * Dialog used to delete a variable.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.variable The variable resource to delete.
 * @constructor
 */
export function DeleteVariableDialog(props: DeleteVariableDialogProps) {
  const { variable, open, onClose, onSuccess } = props;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteVariableMutation = useDeleteVariableMutation(variable.metadata.project);

  const handleSubmit = useCallback(() => {
    return deleteVariableMutation.mutate(variable, {
      onSuccess: (deletedVariable: VariableResource) => {
        successSnackbar(`Variable ${getVariableExtendedDisplayName(deletedVariable)} was successfully deleted`);
        onClose();
        if (onSuccess) {
          onSuccess(variable);
        }
      },
      onError: (err) => {
        exceptionSnackbar(err);
        throw err;
      },
    });
  }, [deleteVariableMutation, variable, onClose, onSuccess, successSnackbar, exceptionSnackbar]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>Delete Variable</Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the variable {getVariableExtendedDisplayName(variable)}? This action cannot be
        undone.
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" type="submit" onClick={handleSubmit}>
          Delete
        </Button>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
