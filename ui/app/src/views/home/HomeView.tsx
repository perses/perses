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

import { Box, Grid, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import HomeIcon from 'mdi-material-ui/Home';
import { useNavigate } from 'react-router-dom';
import { DashboardSelector } from '@perses-dev/core';
import { ProjectModel, useProjectList } from '../../model/project-client';
import { AddProjectDialog } from '../../components/AddProjectDialog/AddProjectDialog';
import { CreateDashboardDialog } from '../../components/CreateDashboardDialog/CreateDashboardDialog';
import DashboardBreadcrumbs from '../../components/DashboardBreadcrumbs';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { InformationSection } from './InformationSection';
import { RecentDashboards } from './RecentDashboards';
import { ProjectsAndDashboards } from './ProjectsAndDashboards';
import { ImportantDashboards } from './ImportantDashboards';

function HomeView() {
  // Navigate to the project page if the project has been successfully added
  const navigate = useNavigate();

  const { data } = useProjectList();

  const projectOptions = useMemo(() => {
    return (data || []).map((project) => project.metadata.name);
  }, [data]);

  const handleAddProjectDialogSubmit = (entity: ProjectModel) => navigate(`/projects/${entity.metadata.name}`);
  const handleAddDashboardDialogSubmit = (dashboardSelector: DashboardSelector) =>
    navigate(`/projects/${dashboardSelector.project}/dashboards/${dashboardSelector.dashboard}/create`);

  // Open/Close management for dialogs
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddDashboardDialogOpen, setIsAddDashboardDialogOpen] = useState(false);

  const handleAddProjectDialogOpen = () => {
    setIsAddProjectDialogOpen(true);
  };
  const handleAddProjectDialogClose = () => {
    setIsAddProjectDialogOpen(false);
  };
  const handleAddDashboardDialogOpen = () => {
    setIsAddDashboardDialogOpen(true);
  };
  const handleAddDashboardDialogClose = () => {
    setIsAddDashboardDialogOpen(false);
  };

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
            <CRUDButton text="Add Project" variant="contained" onClick={handleAddProjectDialogOpen} />
            <CRUDButton
              text="Add Dashboard"
              variant="contained"
              onClick={handleAddDashboardDialogOpen}
              disabled={projectOptions.length === 0}
            />
            <AddProjectDialog
              open={isAddProjectDialogOpen}
              onClose={handleAddProjectDialogClose}
              onSuccess={handleAddProjectDialogSubmit}
            />
            <CreateDashboardDialog
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
          <RecentDashboards />
          <ProjectsAndDashboards />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ImportantDashboards />
          <InformationSection />
        </Grid>
      </Grid>
    </Stack>
  );
}

export default HomeView;
