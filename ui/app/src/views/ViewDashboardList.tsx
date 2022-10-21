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
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { DashboardResource } from '@perses-dev/core';
import { ChevronDown } from 'mdi-material-ui/light';
import { useNavigate } from 'react-router-dom';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { FolderPound } from 'mdi-material-ui';
import { useDashboardList } from '../model/dashboard-client';

function RenderDashboardList() {
  const { data, isLoading } = useDashboardList();
  const navigate = useNavigate();
  if (isLoading) {
    return <CircularProgress size="1rem" />;
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
  dashboardListAsMap.forEach((value, key) => {
    accordions.push(
      <Accordion TransitionProps={{ unmountOnExit: true }} key={key}>
        <AccordionSummary expandIcon={<ChevronDown />}>
          <Stack direction="row" alignItems="center" gap={1}>
            <FolderPound />
            <Typography variant="h3">{key}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {value.map((v, i) => {
              return (
                <Box sx={{ backgroundColor: (theme) => theme.palette.primary.main + '10' }} key={v.metadata.name}>
                  {i !== 0 && <Divider />}
                  <ListItemButton onClick={() => navigate('/projects/' + key + '/dashboards/' + v.metadata.name)}>
                    <ListItemText primary={v.metadata.name} />
                  </ListItemButton>
                </Box>
              );
            })}
          </List>
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
