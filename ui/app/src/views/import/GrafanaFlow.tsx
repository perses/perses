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

import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { JSONEditor, useSnackbar } from '@perses-dev/components';
import AutoFix from 'mdi-material-ui/AutoFix';
import Import from 'mdi-material-ui/Import';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useIsReadonly } from '../../context/Config';
import { useCreateDashboardMutation } from '../../model/dashboard-client';
import type { MigrateBodyRequest } from '../../model/migrate-client';
import { useMigrate } from '../../model/migrate-client';
import { useProjectList } from '../../model/project-client';

type Input = {
  name: string;
  value?: string;
};

// GrafanaLightDashboard is a Grafana dashboard that may have some variables that need to be replaced by the user.
interface GrafanaLightDashboard {
  // The only part that is interesting us is the list of the input that can exists in the Grafana dashboard definition.
  __inputs?: Input[];
  // In order to have an accurate type when matching this interface with the Grafana JSON,
  // we just say we have an unknown list of key that exists, but we don't really care about what they are.
  [key: string]: unknown;
}

interface GrafanaFlowProps {
  dashboard: GrafanaLightDashboard;
  // Project selected by default to import the migrated dashboard into, if the user has access to it.
  defaultProject?: string;
  // Disable the migration and the import, e.g. while the dashboard definition is being edited.
  disabled?: boolean;
}

function GrafanaFlow({ dashboard, defaultProject, disabled = false }: GrafanaFlowProps): ReactElement {
  const migrateMutation = useMigrate();
  const navigate = useNavigate();
  const isReadonly = useIsReadonly();
  const { exceptionSnackbar } = useSnackbar();
  const [projectName, setProjectName] = useState<string | null>(defaultProject ?? null);
  // Values typed by the user, by input name. The other inputs keep the value of the dashboard.
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [useDefaultDatasource, setUseDefaultDatasource] = useState(false);
  // Derived from the current dashboard, as it can change while this component stays mounted (e.g. edited definition).
  const migrateRequest = useMemo<MigrateBodyRequest>(
    () => ({
      input: Object.fromEntries(
        dashboard.__inputs?.map((input) => [input.name, inputValues[input.name] ?? input.value ?? '']) ?? [],
      ),
      grafanaDashboard: dashboard,
      useDefaultDatasource,
    }),
    [dashboard, inputValues, useDefaultDatasource],
  );
  // The migration output is only relevant while the request it was made with is the current one.
  const isMigrationUpToDate = migrateMutation.variables === migrateRequest;
  const { data, isPending, error } = useProjectList();
  const projectNames = useMemo(() => (data ?? []).map((project) => project.metadata.name), [data]);
  // A project that isn't one of the user's projects, like an unknown default project, is ignored.
  const selectedProject = projectName !== null && projectNames.includes(projectName) ? projectName : null;
  const dashboardMutation = useCreateDashboardMutation((data) => {
    navigate(`/projects/${data.metadata.project}/dashboards/${data.metadata.name}`);
  });

  const setInput = (key: string, value: string): void => {
    // Keep the same object when nothing changed, so that the migration output stays up to date.
    setInputValues((currentValues) =>
      currentValues[key] === value ? currentValues : { ...currentValues, [key]: value },
    );
  };

  const importOnClick = (): void => {
    const migratedDashboard = migrateMutation.data;
    if (!isMigrationUpToDate || migratedDashboard === undefined || selectedProject === null) {
      return;
    }
    const dashboardToCreate = structuredClone(migratedDashboard);
    dashboardToCreate.metadata.project = selectedProject;
    dashboardMutation.mutate(dashboardToCreate);
  };

  if (error) {
    exceptionSnackbar(error);
  }

  return (
    <>
      {
        // When you are getting a dashboard from the Grafana marketplace, it can happen there is a list of input that shall be used in a later stage to replace some variables.
        // The code below provide the possibility to the user to provide the list of the input value.
        // These values will be provided to the backend that will take care to replace the variables called with the input name with the values provided.
        dashboard?.__inputs?.map((input, index) => {
          return (
            <TextField
              // Remounted when the dashboard gives another default value, as the field is uncontrolled.
              key={`input-${index}-${input.name}-${input.value ?? ''}`}
              label={input.name}
              defaultValue={migrateRequest.input?.[input.name] ?? ''}
              variant="outlined"
              onBlur={(e) => setInput(input.name, e.target.value)}
            />
          );
        })
      }

      <Alert variant="outlined" severity="warning">
        <Typography>
          As we do not support every feature from Grafana, the migration to Perses can only be partial. For example,
          unsupported panels are replaced by &quot;placeholder&quot; Markdown panels, to at least preserve the dashboard
          structure.
        </Typography>
      </Alert>
      <Stack direction="column" gap={1} width="100%">
        <FormControlLabel
          control={
            <Checkbox
              checked={useDefaultDatasource}
              onChange={(e) => setUseDefaultDatasource(e.target.checked)}
              color="primary"
            />
          }
          label="Use default datasource in Perses"
        />
        <Button
          fullWidth
          variant="contained"
          disabled={disabled || migrateMutation.isPending}
          startIcon={<AutoFix />}
          onClick={() => migrateMutation.mutate(migrateRequest)}
        >
          Migrate
        </Button>
      </Stack>
      {migrateMutation.isPending && <CircularProgress sx={{ alignSelf: 'center' }} />}
      {isMigrationUpToDate && migrateMutation.isError && (
        <Alert variant="outlined" severity="error">
          {migrateMutation.error.message}
        </Alert>
      )}
      {!isPending && data !== undefined && data !== null && isMigrationUpToDate && migrateMutation.isSuccess && (
        <Stack direction="column">
          <Typography variant="h2" sx={{ paddingTop: 2, paddingBottom: 1 }}>
            2. Migration output
          </Typography>
          <JSONEditor value={migrateMutation.data} maxHeight="50rem" width="100%" readOnly />
          <Typography variant="h2" sx={{ paddingTop: 2, paddingBottom: 1 }}>
            3. Import
          </Typography>
          <Stack width="100%" gap={1}>
            <Autocomplete
              disablePortal
              value={selectedProject}
              onChange={(event, value) => {
                setProjectName(value);
              }}
              renderInput={(params) => <TextField {...params} required label="Project name" />}
              options={projectNames}
            />
            <Button
              fullWidth
              variant="contained"
              disabled={disabled || dashboardMutation.isPending || selectedProject === null || isReadonly}
              startIcon={<Import />}
              onClick={importOnClick}
              sx={{ alignSelf: 'stretch' }}
            >
              Import
            </Button>
            {dashboardMutation.isError && (
              <Alert variant="outlined" severity="error">
                {dashboardMutation.error.message}
              </Alert>
            )}
            {isReadonly && (
              <Alert severity="warning" sx={{ backgroundColor: 'transparent', padding: 0 }}>
                Dashboard managed via code only.
              </Alert>
            )}
          </Stack>
        </Stack>
      )}
    </>
  );
}

export default GrafanaFlow;
