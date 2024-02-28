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

import { Box, Grid, MenuItem, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import HomeIcon from 'mdi-material-ui/Home';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { DashboardSelector, ProjectResource } from '@perses-dev/core';
import { CreateProjectDialog, CreateDashboardDialog } from '../../components/dialogs';
import { StackCrumb, TitleCrumb } from '../../components/breadcrumbs/breadcrumbs';
import { useIsMobileSize } from '../../utils/browser-size';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import ButtonMenu from '../../components/ButtonMenu/ButtonMenu';
import { ImportRoute } from '../../model/route';
import { useDashboardCreateAllowedProjects } from '../../context/Authorization';
import { InformationSection } from './InformationSection';
import { RecentDashboards } from './RecentDashboards';
import { ProjectsAndDashboards } from './ProjectsAndDashboards';
import { ImportantDashboards } from './ImportantDashboards';

function HomeView() {
  // Navigate to the project page if the project has been successfully added
  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();
  const userProjects = useDashboardCreateAllowedProjects();

  const projectOptions = useMemo(() => {
    return userProjects.map((project) => project.metadata.name);
  }, [userProjects]);

  const handleAddProjectDialogSubmit = (entity: ProjectResource) => navigate(`/projects/${entity.metadata.name}`);
  const handleAddDashboardDialogSubmit = (dashboardSelector: DashboardSelector) =>
    navigate(`/projects/${dashboardSelector.project}/dashboard/new`, { state: { name: dashboardSelector.dashboard } });

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
    <Stack sx={{ width: '100%', overflowX: 'hidden' }} m={isMobileSize ? 1 : 2} gap={1}>
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <StackCrumb>
            <HomeIcon fontSize={'large'} />
            <TitleCrumb>Home</TitleCrumb>
          </StackCrumb>
          <Stack direction="row" gap={isMobileSize ? 0.5 : 2}>
            <CRUDButton action="create" scope="Project" variant="contained" onClick={handleAddProjectDialogOpen}>
              Add Project
            </CRUDButton>

            <ButtonMenu>
              <CRUDButton
                variant="contained"
                onClick={handleAddDashboardDialogOpen}
                disabled={projectOptions.length === 0}
              >
                Add Dashboard
              </CRUDButton>
              <MenuItem component={RouterLink} to={ImportRoute} disabled={projectOptions.length === 0}>
                <CRUDButton style={{ backgroundColor: 'transparent' }}>Import Dashboard</CRUDButton>
              </MenuItem>
            </ButtonMenu>
            <CreateProjectDialog
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
      <Grid container columnSpacing={8}>
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
