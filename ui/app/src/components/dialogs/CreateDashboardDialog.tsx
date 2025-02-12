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

import { Dispatch, DispatchWithoutAction, ReactElement, useState } from 'react';
import { Button, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardSelector, EphemeralDashboardInfo, getResourceDisplayName, ProjectResource } from '@perses-dev/core';
import {
  CreateDashboardValidationType,
  CreateEphemeralDashboardValidationType,
  useDashboardValidationSchema,
  useEphemeralDashboardValidationSchema,
} from '../../validation';

interface CreateDashboardProps {
  open: boolean;
  projects: ProjectResource[];
  hideProjectSelect?: boolean;
  mode?: 'create' | 'duplicate';
  name?: string;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<DashboardSelector | EphemeralDashboardInfo>;
  isEphemeralDashboardEnabled: boolean;
}

/**
 * Dialog used to create a dashboard.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.projectOptions The project where the dashboard will be created.
 * If it contains only one element, it will be used as project value and will hide the project selection.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 * @param props.isEphemeralDashboardEnabled Display switch button if ephemeral dashbord enabled in config file.
 */
export const CreateDashboardDialog = (props: CreateDashboardProps): ReactElement => {
  const { open, projects, hideProjectSelect, mode, name, onClose, onSuccess, isEphemeralDashboardEnabled } = props;

  const [isTempCopyChecked, setTempCopyChecked] = useState<boolean>(false);
  const action = mode === 'duplicate' ? 'Duplicate' : 'Create';

  // Disables closing on click out. This is a quick-win solution to make sure the currently-existing form
  // will be reset by the related child DuplicationForm component before closing.
  const handleClickOut = (): void => {
    /* do nothing */
  };

  return (
    <Dialog open={open} onClose={handleClickOut} aria-labelledby="confirm-dialog" fullWidth={true}>
      <Dialog.Header>
        {action} Dashboard{name && ': ' + name}
      </Dialog.Header>
      {isEphemeralDashboardEnabled && mode === 'duplicate' && (
        <Dialog.Content sx={{ width: '100%' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isTempCopyChecked}
                onChange={(event) => {
                  setTempCopyChecked(event.target.checked);
                }}
              />
            }
            label="Create as a temporary copy"
          />
        </Dialog.Content>
      )}
      {isTempCopyChecked ? (
        <EphemeralDashboardDuplicationForm {...{ projects: projects, hideProjectSelect, onClose, onSuccess }} />
      ) : (
        <DashboardDuplicationForm {...{ projects: projects, hideProjectSelect, onClose, onSuccess }} />
      )}
    </Dialog>
  );
};

interface DuplicationFormProps {
  projects: ProjectResource[];
  hideProjectSelect?: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<DashboardSelector | EphemeralDashboardInfo>;
}

const DashboardDuplicationForm = (props: DuplicationFormProps): ReactElement => {
  const { projects, hideProjectSelect, onClose, onSuccess } = props;

  const dashboardSchemaValidation = useDashboardValidationSchema();

  const dashboardForm = useForm<CreateDashboardValidationType>({
    resolver: zodResolver(dashboardSchemaValidation),
    mode: 'onBlur',
    defaultValues: { dashboardName: '', projectName: projects[0]?.metadata.name ?? '' },
  });

  const processDashboardForm: SubmitHandler<CreateDashboardValidationType> = (data) => {
    onClose();
    if (onSuccess) {
      onSuccess({ project: data.projectName, dashboard: data.dashboardName } as DashboardSelector);
    }
  };

  const handleClose = (): void => {
    onClose();
    dashboardForm.reset();
  };

  return (
    <FormProvider {...dashboardForm}>
      <form onSubmit={dashboardForm.handleSubmit(processDashboardForm)}>
        <Dialog.Content sx={{ width: '100%' }}>
          <Stack gap={1}>
            {!hideProjectSelect && (
              <Controller
                control={dashboardForm.control}
                name="projectName"
                render={({ field, fieldState }) => (
                  <TextField
                    select
                    {...field}
                    required
                    id="project"
                    label="Project name"
                    type="text"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  >
                    {projects.map((option) => {
                      return (
                        <MenuItem key={option.metadata.name} value={option.metadata.name}>
                          {getResourceDisplayName(option)}
                        </MenuItem>
                      );
                    })}
                  </TextField>
                )}
              />
            )}
            <Controller
              control={dashboardForm.control}
              name="dashboardName"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  margin="dense"
                  id="name"
                  label="Dashboard Name"
                  type="text"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="contained" disabled={!dashboardForm.formState.isValid} type="submit">
            Add
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Dialog.Actions>
      </form>
    </FormProvider>
  );
};

const EphemeralDashboardDuplicationForm = (props: DuplicationFormProps): ReactElement => {
  const { projects, hideProjectSelect, onClose, onSuccess } = props;

  const ephemeralDashboardSchemaValidation = useEphemeralDashboardValidationSchema();

  const ephemeralDashboardForm = useForm<CreateEphemeralDashboardValidationType>({
    resolver: zodResolver(ephemeralDashboardSchemaValidation),
    mode: 'onBlur',
    defaultValues: { dashboardName: '', projectName: projects[0]?.metadata.name ?? '', ttl: '' },
  });

  const processEphemeralDashboardForm: SubmitHandler<CreateEphemeralDashboardValidationType> = (data) => {
    onClose();
    if (onSuccess) {
      onSuccess({
        project: data.projectName,
        dashboard: data.dashboardName,
        ttl: data.ttl,
      } as EphemeralDashboardInfo);
    }
  };

  const handleClose = (): void => {
    onClose();
    ephemeralDashboardForm.reset();
  };

  return (
    <FormProvider {...ephemeralDashboardForm}>
      <form onSubmit={ephemeralDashboardForm.handleSubmit(processEphemeralDashboardForm)}>
        <Dialog.Content sx={{ width: '100%' }}>
          <Stack gap={1}>
            {!hideProjectSelect && (
              <Controller
                control={ephemeralDashboardForm.control}
                name="projectName"
                render={({ field, fieldState }) => (
                  <TextField
                    select
                    {...field}
                    required
                    id="project"
                    label="Project name"
                    type="text"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  >
                    {projects.map((option) => {
                      return (
                        <MenuItem key={option.metadata.name} value={option.metadata.name}>
                          {getResourceDisplayName(option)}
                        </MenuItem>
                      );
                    })}
                  </TextField>
                )}
              />
            )}
            <Controller
              control={ephemeralDashboardForm.control}
              name="dashboardName"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  margin="dense"
                  id="name"
                  label="Dashboard Name"
                  type="text"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={ephemeralDashboardForm.control}
              name="ttl"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  margin="dense"
                  id="ttl"
                  label="Time to live (TTL)"
                  type="text"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ? fieldState.error.message : 'Duration string like 1w, 3d12h..'}
                />
              )}
            />
          </Stack>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="contained" disabled={!ephemeralDashboardForm.formState.isValid} type="submit">
            Add
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Dialog.Actions>
      </form>
    </FormProvider>
  );
};
