// Copyright The Perses Authors
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

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import type { EphemeralDashboardInfo, ProjectResource } from '@perses-dev/client';
import { Dialog, getResourceDisplayName } from '@perses-dev/components';
import type { DashboardSelector } from '@perses-dev/spec';
import type { ChangeEvent, Dispatch, DispatchWithoutAction, ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, FormProvider, useController, useForm, useWatch } from 'react-hook-form';

import type {
  CreateDashboardInput,
  CreateDashboardValidationType,
  CreateEphemeralDashboardValidationType,
} from '../../validation';
import { useDashboardValidationSchema, useEphemeralDashboardValidationSchema } from '../../validation';

interface CreateDashboardProps {
  open: boolean;
  projects: ProjectResource[];
  defaultProject?: string;
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
 * @param props.projects The projects where the dashboard can be created.
 * @param props.hideProjectSelect Hide the project selection, e.g. when `projects` contains a single project.
 * @param props.defaultProject The project selected by default if it belongs to `projects`, otherwise the first one is.
 * @param props.onClose Provides the function to close itself.
 * @param props.onSuccess Action to perform when user confirmed.
 * @param props.isEphemeralDashboardEnabled Display switch button if ephemeral dashboards are enabled in copy dialog.
 */
export const CreateDashboardDialog = (props: CreateDashboardProps): ReactElement => {
  const {
    open,
    projects,
    defaultProject,
    hideProjectSelect,
    mode,
    name,
    onClose,
    onSuccess,
    isEphemeralDashboardEnabled,
  } = props;

  const [isTempCopyChecked, setTempCopyChecked] = useState<boolean>(false);
  const action = mode === 'duplicate' ? 'Duplicate' : 'Create';
  const defaultProjectName =
    (projects.find((project) => project.metadata.name === defaultProject) ?? projects[0])?.metadata.name ?? '';
  const sourceProject = mode === 'duplicate' ? defaultProject : undefined;

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
        <EphemeralDashboardDuplicationForm
          {...{ projects: projects, defaultProjectName, sourceProject, hideProjectSelect, onClose, onSuccess }}
        />
      ) : (
        <DashboardDuplicationForm
          {...{ projects: projects, defaultProjectName, sourceProject, hideProjectSelect, onClose, onSuccess }}
        />
      )}
    </Dialog>
  );
};

interface DuplicationFormProps {
  projects: ProjectResource[];
  defaultProjectName: string;
  sourceProject?: string;
  hideProjectSelect?: boolean;
  onClose: DispatchWithoutAction;
  onSuccess?: Dispatch<DashboardSelector | EphemeralDashboardInfo>;
}

function ProjectChangeInfo({ sourceProject }: { sourceProject: string }): ReactElement {
  return (
    <Alert severity="info">
      Datasources and variables defined in the &apos;{sourceProject}&apos; project are not copied: panels relying on
      them may not work in the selected project.
    </Alert>
  );
}

const DashboardDuplicationForm = (props: DuplicationFormProps): ReactElement => {
  const { projects, defaultProjectName, sourceProject, hideProjectSelect, onClose, onSuccess } = props;

  // Mirrors the form value, as the name uniqueness must be checked against the dashboards of the selected project.
  const [projectName, setProjectName] = useState(defaultProjectName);
  const { schema: dashboardSchemaValidation, isSchemaLoading: isDashboardSchemaValidationLoading } =
    useDashboardValidationSchema(projectName);

  // Only the first load replaces the form with a spinner, later project switches keep the form visible.
  const [isFirstSchemaLoad, setIsFirstSchemaLoad] = useState(true);
  if (isFirstSchemaLoad && !isDashboardSchemaValidationLoading) {
    setIsFirstSchemaLoad(false);
  }

  const dashboardForm = useForm<CreateDashboardInput, unknown, CreateDashboardValidationType>({
    resolver: dashboardSchemaValidation ? zodResolver(dashboardSchemaValidation) : undefined,
    mode: 'onBlur',
    defaultValues: { dashboardName: '', projectName: defaultProjectName, tags: [] },
  });

  const { trigger, getFieldState, control } = dashboardForm;
  const {
    field: { onChange: onProjectFieldChange, ...projectField },
    fieldState: projectFieldState,
  } = useController({ control, name: 'projectName' });
  const handleProjectChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onProjectFieldChange(event);
      setProjectName(event.target.value);
    },
    [onProjectFieldChange],
  );

  // Re-validates the name once the dashboards of the newly selected project are loaded.
  useEffect(() => {
    if (dashboardSchemaValidation && getFieldState('dashboardName').isTouched) {
      void trigger('dashboardName');
    }
  }, [dashboardSchemaValidation, getFieldState, trigger]);

  const handleProcessDashboardForm = useCallback((): SubmitHandler<CreateDashboardValidationType> => {
    return (data) => {
      onClose();
      if (onSuccess) {
        onSuccess({ project: data.projectName, dashboard: data.dashboardName, tags: data.tags } as DashboardSelector);
      }
    };
  }, [onClose, onSuccess]);

  const handleClose = (): void => {
    onClose();
    dashboardForm.reset();
  };

  if (isFirstSchemaLoad)
    return (
      <Stack
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <CircularProgress />
      </Stack>
    );

  return (
    <FormProvider {...dashboardForm}>
      <form onSubmit={dashboardForm.handleSubmit(handleProcessDashboardForm())}>
        <Dialog.Content sx={{ width: '100%' }}>
          <Stack gap={1}>
            {!hideProjectSelect && (
              <TextField
                select
                {...projectField}
                onChange={handleProjectChange}
                required
                id="project"
                label="Project name"
                type="text"
                fullWidth
                error={!!projectFieldState.error}
                helperText={projectFieldState.error?.message}
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
            {sourceProject !== undefined && projectName !== sourceProject && (
              <ProjectChangeInfo sourceProject={sourceProject} />
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
            <Controller
              control={dashboardForm.control}
              name="tags"
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  multiple
                  freeSolo
                  options={[]}
                  value={field.value ?? []}
                  onChange={(_, newValue) =>
                    field.onChange(
                      Array.from(
                        new Set(newValue.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0)),
                      ),
                    )
                  }
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Type a tag and press Enter"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      inputProps={{
                        ...params.inputProps,
                        maxLength: 50,
                      }}
                    />
                  )}
                />
              )}
            />
          </Stack>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            variant="contained"
            disabled={isDashboardSchemaValidationLoading || !dashboardForm.formState.isValid}
            type="submit"
          >
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
  const { projects, defaultProjectName, sourceProject, hideProjectSelect, onClose, onSuccess } = props;

  const ephemeralDashboardSchemaValidation = useEphemeralDashboardValidationSchema();

  const ephemeralDashboardForm = useForm<CreateEphemeralDashboardValidationType>({
    resolver: zodResolver(ephemeralDashboardSchemaValidation),
    mode: 'onBlur',
    defaultValues: { dashboardName: '', projectName: defaultProjectName, ttl: '' },
  });
  const projectName = useWatch({ control: ephemeralDashboardForm.control, name: 'projectName' });

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
            {sourceProject !== undefined && projectName !== sourceProject && (
              <ProjectChangeInfo sourceProject={sourceProject} />
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
