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

import { Box, Button, Card, Grid, Stack, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import HomeIcon from 'mdi-material-ui/Home';
import { useNavigate } from 'react-router-dom';
import HistoryIcon from 'mdi-material-ui/History';
import FormatListBulletedIcon from 'mdi-material-ui/FormatListBulleted';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import { DashboardSelector } from '@perses-dev/core';
import { ProjectModel, useProjectList } from '../../model/project-client';
import { AddProjectDialog } from '../../components/AddProjectDialog/AddProjectDialog';
import { CreateDashboardInProjectDialog } from '../../components/CreateDashboardDialog/CreateDashboardInProjectDialog';
import DashboardBreadcrumbs from '../../components/DashboardBreadcrumbs';
import { InformationSection } from './InformationSection';
import { RecentDashboardsMosaic } from './RecentDashboardsMosaic';
import { SearchableDashboards } from './SearchableDashboards';
import { ImportantDashboard } from './ImportantDashboards';

function HomeView() {
  // Navigate to the project page if the project has been successfully added
  const navigate = useNavigate();

  const { data } = useProjectList();

  const projectOptions = useMemo(() => {
    return (data || []).map((project) => project.metadata.name);
  }, [data]);

  const handleAddProjectDialogSubmit = useCallback(
    (entity: ProjectModel) => navigate(`/projects/${entity.metadata.name}`),
    [navigate]
  );

  const handleAddDashboardDialogSubmit = useCallback(
    (dashboardSelector: DashboardSelector) =>
      navigate(`/projects/${dashboardSelector.project}/dashboards/${dashboardSelector.dashboard}/create`),
    [navigate]
  );

  // Open/Close management for dialogs
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddDashboardDialogOpen, setIsAddDashboardDialogOpen] = useState(false);

  const handleAddProjectDialogOpen = useCallback(() => {
    setIsAddProjectDialogOpen(true);
  }, []);
  const handleAddProjectDialogClose = useCallback(() => {
    setIsAddProjectDialogOpen(false);
  }, []);

  const handleAddDashboardDialogOpen = useCallback(() => {
    setIsAddDashboardDialogOpen(true);
  }, []);
  const handleAddDashboardDialogClose = useCallback(() => {
    setIsAddDashboardDialogOpen(false);
  }, []);

  return (
    <Stack sx={{ width: '100%' }} m={2} gap={2}>
      <DashboardBreadcrumbs />
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <HomeIcon fontSize={'large'} />
            <Typography variant="h1">Home</Typography>
          </Stack>
          <Stack direction="row" gap={2}>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: 'uppercase' }}
              onClick={handleAddProjectDialogOpen}
            >
              Add Project
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: 'uppercase' }}
              onClick={handleAddDashboardDialogOpen}
            >
              Add Dashboard
            </Button>
            <AddProjectDialog
              open={isAddProjectDialogOpen}
              onClose={handleAddProjectDialogClose}
              onSuccess={handleAddProjectDialogSubmit}
            />
            <CreateDashboardInProjectDialog
              open={isAddDashboardDialogOpen}
              projectOptions={projectOptions}
              onClose={handleAddDashboardDialogClose}
              onSuccess={handleAddDashboardDialogSubmit}
            />
          </Stack>
        </Stack>
      </Box>
      <Grid container spacing={8}>
        <Grid item xs={12} lg={8}>
          <Stack>
            <Stack direction="row" alignItems="center" gap={1}>
              <HistoryIcon />
              <h2>Recent Dashboards</h2>
            </Stack>
            <Grid container spacing={2}>
              <RecentDashboardsMosaic></RecentDashboardsMosaic>
            </Grid>
          </Stack>
          <Stack my={2}>
            <Stack direction="row" alignItems="center" gap={1}>
              <FormatListBulletedIcon />
              <h2>Projects & Dashboards</h2>
            </Stack>
            <SearchableDashboards id="project-dashboard-list"></SearchableDashboards>
          </Stack>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Stack>
            <Stack direction="row" alignItems="center" gap={1}>
              <ViewDashboardIcon />
              <h2>Important Dashboards</h2>
            </Stack>
            <Card>
              <ImportantDashboard id="important-dashboard-list"></ImportantDashboard>
            </Card>
          </Stack>
          <Stack my={2}>
            <InformationSection></InformationSection>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default HomeView;
