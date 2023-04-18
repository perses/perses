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
import { Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { DashboardSelector } from '@perses-dev/core';

export interface CreateDashboardInProjectProps {
  open: boolean;
  projectOptions: string[];
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<DashboardSelector>;
}

/**
 * Dialog used to create a dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @param props.projectName The project where the dashboard will be created.
 * @constructor
 */
export const CreateDashboardInProjectDialog = (props: CreateDashboardInProjectProps) => {
  const { open, projectOptions, onClose, onSuccess } = props;
  const [projectName, setProjectName] = useState<string>();
  const [dashboardName, setDashboardName] = useState<string>();
  const [dashboardError, setDashboardError] = useState<string>();
  const [projectError, setProjectError] = useState<string>();

  const handleProjectChange = useCallback((e: SelectChangeEvent) => {
    setProjectName(e.target.value);
    if (!e.target.value) {
      setProjectError('Required');
    } else {
      setProjectError(undefined);
    }
  }, []);

  const handleDashboardChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDashboardName(e.target.value);
    if (!e.target.value) {
      setDashboardError('Required');
    } else {
      setDashboardError(undefined);
    }
  }, []);

  // Reinitialize form for next time the dialog is opened
  const resetForm = useCallback(() => {
    setDashboardName(undefined);
    setDashboardError(undefined);
  }, []);

  const handleSubmit = useCallback(() => {
    if (projectName && dashboardName) {
      onClose();
      if (onSuccess) {
        onSuccess({ project: projectName, dashboard: dashboardName } as DashboardSelector);
      }
      resetForm();
    }
  }, [dashboardName, onClose, onSuccess, projectName, resetForm]);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog">
      <Dialog.Header>Create Dashboard</Dialog.Header>
      <Dialog.Content>
        <FormControl size="small" fullWidth>
          <InputLabel>Project name</InputLabel>
          <Select
            required
            margin="dense"
            id="project"
            label="Project name"
            type="text"
            fullWidth
            onChange={handleProjectChange}
            value={dashboardName}
            error={!!projectError}
          >
            {projectOptions.map((option) => {
              return (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <TextField
          required
          margin="dense"
          id="name"
          label="Dashboard Name"
          type="text"
          fullWidth
          onChange={handleDashboardChange}
          value={dashboardName}
          error={!!dashboardError}
          helperText={dashboardError}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" disabled={!!dashboardError} onClick={handleSubmit}>
          Add
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};
