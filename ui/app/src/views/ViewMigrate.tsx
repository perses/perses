// Copyright 2022 The Perses Authors
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
  Button,
  CircularProgress,
  Container,
  Stack,
  TextareaAutosize,
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
import { useCreateDashboard } from '../model/dashboard-client';

function ViewMigrate() {
  const [grafanaDashboard, setGrafanaDashboard] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const isLaptopSize = useMediaQuery(useTheme().breakpoints.up('sm'));
  const navigate = useNavigate();
  const migrateMutation = useMigrate();
  const dashboardMutation = useCreateDashboard((data) => {
    navigate(`/projects/${data.metadata.project}/dashboards/${data.metadata.name}`);
  });
  const fileUploadOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files === null) {
      return;
    }
    const value = await files[0]?.text();
    if (value !== undefined) {
      setGrafanaDashboard(value);
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
  return (
    <Container maxWidth="md">
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <AutoFix fontSize={'large'} />
        <Typography variant="h1">Migrate</Typography>
      </Stack>
      <Stack direction={'column'} spacing={2} mt={2}>
        <Alert variant={'outlined'} severity={'warning'}>
          <Typography>
            As we do not support every feature from Grafana, the migration to Perses can only be partial. Some panels
            for example will not be migrated but instead replaced by a Markdown panel with a text explaining we are not
            able to migrate your panel.
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
        <TextareaAutosize
          value={grafanaDashboard}
          onChange={(e) => setGrafanaDashboard(e.target.value)}
          minRows={10}
          maxRows={20}
          placeholder="Paste your Grafana dashboard"
        />
        <Button
          disabled={migrateMutation.isLoading}
          startIcon={<AutoFix />}
          onClick={() => {
            migrateMutation.mutate(grafanaDashboard);
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
          <Stack direction={'row'} spacing={2}>
            <JSONEditor value={migrateMutation.data} />
            <Stack spacing={1}>
              <TextField
                required
                label={'Project Name'}
                onChange={(event) => {
                  setProjectName(event.target.value);
                }}
              />
              <Button
                variant="contained"
                disabled={dashboardMutation.isLoading}
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
