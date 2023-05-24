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
import { Dialog } from '@perses-dev/components';
import { DashboardResource } from '@perses-dev/core';
import { dashboardExtendedDisplayName } from '@perses-dev/core/dist/utils/text';
import { useSnackbar } from '@perses-dev/dashboards';
import { useDeleteDashboardMutation } from '../../model/dashboard-client';

export interface DeleteDashboardDialogProps {
  dashboard: DashboardResource;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<DashboardResource>;
}

/**
 * Dialog used to delete a dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.dashboard The dashboard resource to delete.
 * @constructor
 */
export const DeleteDashboardDialog = (props: DeleteDashboardDialogProps) => {
  const { dashboard, open, onClose, onSuccess } = props;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteDashboardMutation = useDeleteDashboardMutation();

  const handleSubmit = useCallback(() => {
    return deleteDashboardMutation.mutate(dashboard, {
      onSuccess: (deletedDashboard: DashboardResource) => {
        successSnackbar(`Dashboard ${dashboardExtendedDisplayName(deletedDashboard)} was successfully deleted`);
        onClose();
        if (onSuccess) {
          onSuccess(dashboard);
        }
      },
      onError: (err) => {
        exceptionSnackbar(err);
        throw err;
      },
    });
  }, [deleteDashboardMutation, dashboard, onClose, onSuccess, successSnackbar, exceptionSnackbar]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>Delete Dashboard</Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the dashboard {dashboardExtendedDisplayName(dashboard)}? This action cannot be
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
};
