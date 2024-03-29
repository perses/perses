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

import { Alert, Autocomplete, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import Import from 'mdi-material-ui/Import';
import { useNavigate } from 'react-router-dom';

import { JSONEditor, useSnackbar } from '@perses-dev/components';
import AutoFix from 'mdi-material-ui/AutoFix';
import { useMigrate } from '../../model/migrate-client';
import { useProjectList } from '../../model/project-client';
import { useCreateDashboardMutation } from '../../model/dashboard-client';
import { useIsReadonly } from '../../context/Config';

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
}

function GrafanaFlow({ dashboard }: GrafanaFlowProps) {
  const migrateMutation = useMigrate();
  const navigate = useNavigate();
  const isReadonly = useIsReadonly();
  const { exceptionSnackbar } = useSnackbar();
  const [projectName, setProjectName] = useState<string>('');
  const [grafanaInput, setGrafanaInput] = useState<Record<string, string>>({});
  const { data, isLoading } = useProjectList({ onError: exceptionSnackbar });
  const dashboardMutation = useCreateDashboardMutation((data) => {
    navigate(`/projects/${data.metadata.project}/dashboards/${data.metadata.name}`);
  });

  // initialize the map with the provided input values if exist
  dashboard?.__inputs?.map((input) => {
    grafanaInput[input.name] = input.value ?? '';
  });

  const setInput = (key: string, value: string) => {
    grafanaInput[key] = value;
    setGrafanaInput(grafanaInput);
  };

  const importOnClick = () => {
    const dashboard = migrateMutation.data;
    if (dashboard === undefined) {
      return;
    }
    dashboard.metadata.project = projectName;
    dashboardMutation.mutate(dashboard);
  };

  return (
    <>
      {// When you are getting a dashboard from the Grafana marketplace, it can happen there is a list of input that shall be used in a later stage to replace some variables.
      // The code below provide the possibility to the user to provide the list of the input value.
      // These values will be provided to the backend that will take care to replace the variables called with the input name with the values provided.
      dashboard?.__inputs?.map((input, index) => {
        return (
          <TextField
            key={`input-${index}`}
            label={input.name}
            defaultValue={input.value ?? ''}
            variant={'outlined'}
            onBlur={(e) => setInput(input.name, e.target.value)}
          />
        );
      })}

      <Alert variant="outlined" severity="warning">
        <Typography>
          As we do not support every feature from Grafana, the migration to Perses can only be partial. For example,
          unsupported panels are replaced by &quot;placeholder&quot; Markdown panels, to at least preserve the dashboard
          structure.
        </Typography>
      </Alert>
      <Button
        variant="contained"
        disabled={migrateMutation.isLoading}
        startIcon={<AutoFix />}
        onClick={() => {
          migrateMutation.mutate({ input: grafanaInput, grafanaDashboard: dashboard ?? {} });
        }}
      >
        Migrate
      </Button>
      {migrateMutation.isLoading && <CircularProgress sx={{ alignSelf: 'center' }} />}
      {migrateMutation.isError && (
        <Alert variant="outlined" severity="error">
          {migrateMutation.error.message}
        </Alert>
      )}
      {!isLoading && data !== undefined && data !== null && migrateMutation.isSuccess && (
        <Stack direction="column">
          <Typography variant="h2" sx={{ paddingTop: 2, paddingBottom: 1 }}>
            2. Migration output
          </Typography>
          <JSONEditor value={migrateMutation.data} maxHeight="50rem" width="100%" readOnly />
          <Typography variant="h2" sx={{ paddingTop: 2, paddingBottom: 1 }}>
            3. Import
          </Typography>
          <Stack width={'100%'} gap={1}>
            <Autocomplete
              disablePortal
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Project name"
                  onBlur={(event) => {
                    setProjectName(event.target.value);
                  }}
                />
              )}
              options={data.map((project) => {
                return project.metadata.name;
              })}
            />
            <Button
              variant="contained"
              disabled={dashboardMutation.isLoading || projectName.length === 0 || isReadonly}
              startIcon={<Import />}
              onClick={importOnClick}
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
