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
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AutoFix from 'mdi-material-ui/AutoFix';
import Upload from 'mdi-material-ui/Upload';
import Import from 'mdi-material-ui/Import';
import { ChangeEvent, useState } from 'react';
import { JSONEditor } from '@perses-dev/components';
import { useNavigate } from 'react-router-dom';
import { useMigrate } from '../model/migrate-client';
import { useCreateDashboardMutation } from '../model/dashboard-client';

interface GrafanaLightDashboard {
  // The only part that is interesting us is the list of the input that can exists in the Grafana dashboard definition.
  __inputs?: Array<{ name: string }>;
  // In order to have an accurate type when matching this interface with the Grafana JSON,
  // we just say we have an unknown list of key that exists, but we don't really care about what they are.
  [key: string]: unknown;
}

function ViewMigrate() {
  const [grafanaDashboard, setGrafanaDashboard] = useState<string>('');
  const [lightGrafanaDashboard, setLightGrafanaDashboard] = useState<GrafanaLightDashboard>();
  const [grafanaInput, setGrafanaInput] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState<string>('');
  const isLaptopSize = useMediaQuery(useTheme().breakpoints.up('sm'));
  const navigate = useNavigate();
  const migrateMutation = useMigrate();
  const dashboardMutation = useCreateDashboardMutation((data) => {
    navigate(`/projects/${data.metadata.project}/dashboards/${data.metadata.name}`);
  });
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
  const completeGrafanaDashboard = (dashboard: string) => {
    setLightGrafanaDashboard(JSON.parse(dashboard));
    setGrafanaDashboard(dashboard);
  };
  const setInput = (key: string, value: string) => {
    grafanaInput[key] = value;
    setGrafanaInput(grafanaInput);
  };
  return (
    <Container maxWidth="md" sx={{ marginY: 2 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <AutoFix fontSize={'large'} />
        <Typography variant="h1">Migrate</Typography>
      </Stack>
      <Stack direction={'column'} spacing={1} mt={2}>
        <Alert variant={'outlined'} severity={'warning'}>
          <Typography>
            As we do not support every feature from Grafana, the migration to Perses can only be partial. For example,
            unsupported panels are replaced by &quot;placeholder&quot; Markdown panels, to at least preserve the
            dashboard structure.
          </Typography>
        </Alert>
        <Alert variant={'outlined'} severity={'warning'}>
          <Typography>
            If your dashboard contains Library panels, in order to migrate these nicely you should collapse their
            respective parent row (if applicable) before pasting the JSON here.
          </Typography>
        </Alert>
        <Button
          startIcon={<Upload />}
          variant="contained"
          component="label"
          sx={{ width: isLaptopSize ? '25%' : '50%' }}
        >
          Upload JSON file
          <input type="file" onChange={fileUploadOnChange} hidden />
        </Button>
        <TextField
          value={grafanaDashboard}
          onChange={(e) => completeGrafanaDashboard(e.target.value)}
          multiline
          fullWidth
          minRows={10}
          maxRows={20}
          label="Grafana dashboard"
          placeholder="Paste your Grafana dashboard"
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
          disabled={migrateMutation.isLoading || grafanaDashboard.length == 0}
          startIcon={<AutoFix />}
          onClick={() => {
            migrateMutation.mutate({ input: grafanaInput, grafana_dashboard: grafanaDashboard });
          }}
        >
          Migrate
        </Button>
        {migrateMutation.isLoading && <CircularProgress sx={{ alignSelf: 'center' }} />}
        {migrateMutation.isError && (
          <Alert variant={'outlined'} severity={'error'}>
            {migrateMutation.error.message}
          </Alert>
        )}
        {migrateMutation.isSuccess && (
          <Stack direction={'row'} spacing={1}>
            <Box width={'80%'}>
              <JSONEditor value={migrateMutation.data} maxHeight={'50rem'} width={'100%'} />
            </Box>
            <Stack spacing={1}>
              <TextField
                required
                label={'Project Name'}
                onBlur={(event) => {
                  setProjectName(event.target.value);
                }}
              />
              <Button
                variant="contained"
                disabled={dashboardMutation.isLoading || projectName.length === 0}
                startIcon={<Import />}
                onClick={importOnClick}
              >
                Import
              </Button>
              {dashboardMutation.isError && (
                <Alert variant={'outlined'} severity={'error'}>
                  {dashboardMutation.error.message}
                </Alert>
              )}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default ViewMigrate;
