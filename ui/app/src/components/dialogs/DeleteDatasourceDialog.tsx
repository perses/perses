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
import { Button } from '@mui/material';
import { Dialog, useSnackbar } from '@perses-dev/components';
import { Datasource } from '@perses-dev/core';
import { getDatasourceExtendedDisplayName } from '@perses-dev/core/dist/utils/text';
import { useDeleteDatasourceMutation } from '../../model/project-client';

export interface DeleteDatasourceDialogProps {
  datasource: Datasource;
  open: boolean;
  onClose: DispatchWithoutAction;
  onDelete: DispatchWithoutAction;
  onSuccess?: Dispatch<Datasource>;
}

/**
 * Dialog used to delete a datasource.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.datasource The datasource resource to delete.
 * @constructor
 */
export const DeleteDatasourceDialog = (props: DeleteDatasourceDialogProps) => {
  const { datasource, open, onClose, onDelete, onSuccess } = props;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteDatasourceMutation = useDeleteDatasourceMutation(datasource.metadata.project);

  const handleSubmit = useCallback(() => {
    return deleteDatasourceMutation.mutate(datasource, {
      onSuccess: (deletedDatasource: Datasource) => {
        successSnackbar(`Datasource ${getDatasourceExtendedDisplayName(deletedDatasource)} was successfully deleted`);
        onClose();
        onDelete();
        if (onSuccess) {
          onSuccess(datasource);
        }
      },
      onError: (err) => {
        exceptionSnackbar(err);
        throw err;
      },
    });
  }, [deleteDatasourceMutation, datasource, onClose, onDelete, onSuccess, successSnackbar, exceptionSnackbar]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>Delete Datasource</Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the datasource {getDatasourceExtendedDisplayName(datasource)}? This action
        cannot be undone.
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
};
