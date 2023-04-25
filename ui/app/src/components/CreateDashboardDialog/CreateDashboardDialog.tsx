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
import { Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { DashboardSelector } from '@perses-dev/core';

export interface CreateDashboardProps {
  open: boolean;
  projectOptions: string[];
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<DashboardSelector>;
}

/**
 * Dialog used to create a dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.projectOptions The project where the dashboard will be created.
 * If it contains only one element, it will be used as project value and will hide the project selection.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 * @constructor
 */
export const CreateDashboardDialog = (props: CreateDashboardProps) => {
  const { open, projectOptions, onClose, onSuccess } = props;

  const [projectName, setProjectName] = useState<string | undefined>(projectOptions[0]);
  const [projectError, setProjectError] = useState<string>();

  const [dashboardName, setDashboardName] = useState<string>();
  const [dashboardError, setDashboardError] = useState<string>();

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
        <Stack gap={1}>
          {projectOptions && projectOptions.length > 1 && (
            <FormControl size="small" fullWidth>
              <InputLabel id="project-name-id">Project name</InputLabel>
              <Select
                labelId="project-name-id"
                required
                id="project"
                label="Project name"
                type="text"
                fullWidth
                onChange={handleProjectChange}
                value={projectName}
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
          )}
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
        </Stack>
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
