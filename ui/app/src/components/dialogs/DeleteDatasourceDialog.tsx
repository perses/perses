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
import { Datasource, GlobalDatasource } from '@perses-dev/core';
import { getDatasourceExtendedDisplayName } from '@perses-dev/core/dist/utils/text';
import { useDeleteDatasourceMutation } from '../../model/project-client';
import { useDeleteGlobalDatasourceMutation } from '../../model/admin-client';

export interface DeleteProjectDatasourceDialogProps {
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
export const DeleteProjectDatasourceDialog = (props: DeleteProjectDatasourceDialogProps) => {
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

  return <DeleteDatasourceDialog datasource={datasource} open={open} onDelete={handleSubmit} onClose={onClose} />;
};

export interface DeleteGlobalDatasourceDialogProps {
  datasource: GlobalDatasource;
  open: boolean;
  onClose: DispatchWithoutAction;
  onDelete: DispatchWithoutAction;
  onSuccess?: Dispatch<GlobalDatasource>;
}

/**
 * Dialog used to delete a global datasource.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.datasource The datasource resource to delete.
 * @constructor
 */
export const DeleteGlobalDatasourceDialog = (props: DeleteGlobalDatasourceDialogProps) => {
  const { datasource, open, onClose, onDelete, onSuccess } = props;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const deleteDatasourceMutation = useDeleteGlobalDatasourceMutation();

  const handleSubmit = useCallback(() => {
    return deleteDatasourceMutation.mutate(datasource, {
      onSuccess: (deletedDatasource: GlobalDatasource) => {
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

  return <DeleteDatasourceDialog datasource={datasource} open={open} onDelete={handleSubmit} onClose={onClose} />;
};

interface DeleteDatasourceDialogProps {
  datasource: Datasource | GlobalDatasource;
  open: boolean;
  onDelete: DispatchWithoutAction;
  onClose: DispatchWithoutAction;
}

/**
 * Generic component to build a Dialog for datasource deletion
 */
function DeleteDatasourceDialog(props: DeleteDatasourceDialogProps) {
  const { datasource, open, onDelete, onClose } = props;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>Delete Datasource</Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the datasource {getDatasourceExtendedDisplayName(datasource)}? This action
        cannot be undone.
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" type="submit" onClick={onDelete}>
          Delete
        </Button>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
