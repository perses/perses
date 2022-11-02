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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { DashboardResource } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { ChevronDown, FolderPound } from 'mdi-material-ui';
import { useDashboardList } from '../model/dashboard-client';
import DashboardList from '../components/DashboardList';

function RenderDashboardList() {
  const { data, isLoading } = useDashboardList();
  if (isLoading) {
    return <CircularProgress />;
  }

  if (data === undefined) return null;

  const dashboardListAsMap = new Map<string, DashboardResource[]>();
  if (Array.isArray(data)) {
    data.map((dashboard) => {
      const project = dashboard.metadata.project;
      const list = dashboardListAsMap.get(project);
      if (list !== undefined) {
        list.push(dashboard);
      } else {
        dashboardListAsMap.set(project, [dashboard]);
      }
    });
  }

  const accordions: JSX.Element[] = [];
  dashboardListAsMap.forEach((list, projectName: string) => {
    accordions.push(
      <Accordion TransitionProps={{ unmountOnExit: true }} key={projectName}>
        <AccordionSummary expandIcon={<ChevronDown />}>
          <Stack direction="row" alignItems="center" gap={1}>
            <FolderPound />
            <Typography variant="h3">{projectName}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <DashboardList dashboardList={list} />
        </AccordionDetails>
      </Accordion>
    );
  });

  return <Box>{accordions}</Box>;
}

function ViewDashboardList() {
  return (
    <Container maxWidth="md">
      <Typography variant="h2" mb={2}>
        Dashboards
      </Typography>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <RenderDashboardList />
      </ErrorBoundary>
    </Container>
  );
}

export default ViewDashboardList;
