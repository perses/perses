// Copyright 2024 The Perses Authors
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
import { EphemeralDashboardResource } from '@perses-dev/core';
import { getDashboardExtendedDisplayName } from '@perses-dev/core/dist/utils/text';
import { useDeleteEphemeralDashboardMutation } from '../../model/ephemeral-dashboard-client';

export interface DeleteEphemeralDashboardDialogProps {
  ephemeralDashboard: EphemeralDashboardResource;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<EphemeralDashboardResource>;
}

/**
 * Dialog used to delete a dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.ephemeralDashboard The ephemeral dashboard resource to delete.
 */
export const DeleteEphemeralDashboardDialog = (props: DeleteEphemeralDashboardDialogProps) => {
  const { ephemeralDashboard, open, onClose, onSuccess } = props;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteEphemeralDashboardMutation = useDeleteEphemeralDashboardMutation();

  const handleSubmit = useCallback(() => {
    return deleteEphemeralDashboardMutation.mutate(ephemeralDashboard, {
      onSuccess: (deletedEphemeralDashboard: EphemeralDashboardResource) => {
        successSnackbar(
          `Ephemeral Dashboard ${getDashboardExtendedDisplayName(deletedEphemeralDashboard)} was successfully deleted`
        );
        onClose();
        if (onSuccess) {
          onSuccess(ephemeralDashboard);
        }
      },
      onError: (err) => {
        exceptionSnackbar(err);
        throw err;
      },
    });
  }, [deleteEphemeralDashboardMutation, ephemeralDashboard, onClose, onSuccess, successSnackbar, exceptionSnackbar]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>Delete Ephemeral Dashboard</Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the ephemeral dashboard {getDashboardExtendedDisplayName(ephemeralDashboard)}?
        This action cannot be be be undone.
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
