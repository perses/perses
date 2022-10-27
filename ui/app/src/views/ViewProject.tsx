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

import { useParams } from 'react-router-dom';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { FolderPound, ViewDashboard } from 'mdi-material-ui';
import { useDashboardList } from '../model/dashboard-client';
import { DashboardList } from './ViewDashboardList';

interface RenderDashboardInProjectProperties {
  projectName: string;
}

function RenderDashboardInProject(props: RenderDashboardInProjectProperties) {
  const { data } = useDashboardList(props.projectName);
  if (data === undefined) {
    return null;
  }
  return (
    <Paper>
      <Box p={1}>
        <Stack direction="row" alignItems="center" gap={1} my={2}>
          <ViewDashboard />
          <Typography variant="h3">Dashboards</Typography>
        </Stack>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <DashboardList dashboardList={data} />
        </ErrorBoundary>
      </Box>
    </Paper>
  );
}

function ViewProject() {
  const { projectName } = useParams();
  if (projectName === undefined) {
    throw new Error('Unable to get the Project name');
  }
  return (
    <Container maxWidth="md">
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <FolderPound fontSize={'large'} />
        <Typography variant="h1">{projectName}</Typography>
      </Stack>
      <RenderDashboardInProject projectName={projectName} />
    </Container>
  );
}

export default ViewProject;
