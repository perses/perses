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

import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoFix from 'mdi-material-ui/AutoFix';
import Upload from 'mdi-material-ui/Upload';
import Import from 'mdi-material-ui/Import';
import { ChangeEvent, useState } from 'react';
import { JSONEditor, useSnackbar } from '@perses-dev/components';
import { useNavigate } from 'react-router-dom';
import { useMigrate } from '../model/migrate-client';
import { useCreateDashboardMutation } from '../model/dashboard-client';
import { useIsReadonly } from '../context/Config';
import { useProjectList } from '../model/project-client';
import { useIsMobileSize } from '../utils/browser-size';

interface GrafanaLightDashboard {
  // The only part that is interesting us is the list of the input that can exists in the Grafana dashboard definition.
  __inputs?: Array<{ name: string }>;
  // In order to have an accurate type when matching this interface with the Grafana JSON,
  // we just say we have an unknown list of key that exists, but we don't really care about what they are.
  [key: string]: unknown;
}

function MigrateView() {
  const [grafanaDashboard, setGrafanaDashboard] = useState<Record<string, unknown>>();
  const [isValidJson, setIsValidJson] = useState<boolean>(false);
  const [lightGrafanaDashboard, setLightGrafanaDashboard] = useState<GrafanaLightDashboard>();
  const [grafanaInput, setGrafanaInput] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState<string>('');
  const navigate = useNavigate();
  const isReadonly = useIsReadonly();
  const migrateMutation = useMigrate();
  const dashboardMutation = useCreateDashboardMutation((data) => {
    navigate(`/projects/${data.metadata.project}/dashboards/${data.metadata.name}`);
  });
  const { exceptionSnackbar } = useSnackbar();
  const isMobileSize = useIsMobileSize();
  const { data, isLoading } = useProjectList({ onError: exceptionSnackbar });

  const fileUploadOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files === null) {
      return;
    }
    const value = await files[0]?.text();
    if (value !== undefined) {
      completeGrafanaDashboard(value);
    }
  };

  const importOnClick = () => {
    const dashboard = migrateMutation.data;
    if (dashboard === undefined) {
      return;
    }
    dashboard.metadata.project = projectName;
    dashboardMutation.mutate(dashboard);
  };

  const completeGrafanaDashboard = (dashboard: string | undefined) => {
    try {
      const json = JSON.parse(dashboard ?? '{}');
      setGrafanaDashboard(json);
      setLightGrafanaDashboard(json);
      setIsValidJson(true);
    } catch (e) {
      setIsValidJson(false);
    }
  };

  const setInput = (key: string, value: string) => {
    grafanaInput[key] = value;
    setGrafanaInput(grafanaInput);
  };

  return (
    <Container maxWidth="lg" sx={{ padding: isMobileSize ? 1 : 2, overflowX: 'hidden' }}>
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <AutoFix fontSize="large" />
        <Typography variant="h1">Migrate</Typography>
      </Stack>
      <Stack direction="column" spacing={1}>
        <Alert variant="outlined" severity="warning">
          <Typography>
            As we do not support every feature from Grafana, the migration to Perses can only be partial. For example,
            unsupported panels are replaced by &quot;placeholder&quot; Markdown panels, to at least preserve the
            dashboard structure.
          </Typography>
        </Alert>
        <Typography variant="h2" sx={{ paddingTop: 2 }}>
          1. Provide a Grafana dashboard
        </Typography>
        <Button fullWidth startIcon={<Upload />} variant="outlined" component="label">
          Upload JSON file
          <input type="file" onChange={fileUploadOnChange} hidden style={{ width: '100%' }} />
        </Button>
        <Divider>OR</Divider>
        <JSONEditor
          value={grafanaDashboard}
          onChange={(value: string) => completeGrafanaDashboard(value)}
          minHeight="10rem"
          maxHeight="30rem"
          width="100%"
          placeholder="Paste your Grafana Dashboard JSON here..."
        />
        {
          // When you are getting a dashboard from the Grafana marketplace, it can happen there is a list of input that shall be used in a later stage to replace some variables.
          // The code below provide the possibility to the user to provide the list of the input value.
          // These values will be provided to the backend that will take care to replace the variables called with the input name with the values provided.
          lightGrafanaDashboard?.__inputs?.map((input, index) => {
            return (
              <TextField
                key={`input-${index}`}
                label={input.name}
                variant={'outlined'}
                onBlur={(e) => setInput(input.name, e.target.value)}
              />
            );
          })
        }
        <Button
          variant="contained"
          disabled={migrateMutation.isLoading || !isValidJson}
          startIcon={<AutoFix />}
          onClick={() => {
            migrateMutation.mutate({ input: grafanaInput, grafanaDashboard: grafanaDashboard ?? {} });
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
      </Stack>
    </Container>
  );
}

export default MigrateView;
