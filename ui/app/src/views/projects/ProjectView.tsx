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

import { useNavigate, useParams } from 'react-router-dom';
import { Box, Stack, Typography, Grid } from '@mui/material';
import FolderPound from 'mdi-material-ui/FolderPound';
import { useCallback, useState } from 'react';
import { DeleteProjectDialog } from '../../components/DeleteProjectDialog/DeleteProjectDialog';
import DashboardBreadcrumbs from '../../components/DashboardBreadcrumbs';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { RecentlyViewedDashboards } from './RecentlyViewedDashboards';
import { ProjectDashboards } from './ProjectDashboards';

function ProjectView() {
  const { projectName } = useParams();
  if (projectName === undefined) {
    throw new Error('Unable to get the project name');
  }

  // Navigate to the home page if the project has been successfully deleted
  const navigate = useNavigate();
  const handleDeleteProjectDialogSuccess = useCallback(() => navigate(`/`), [navigate]);

  // Open/Close management for the "Delete Project" dialog
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState<boolean>(false);
  const handleDeleteProjectDialogOpen = useCallback(
    () => setIsDeleteProjectDialogOpen(true),
    [setIsDeleteProjectDialogOpen]
  );
  const handleDeleteProjectDialogClose = useCallback(
    () => setIsDeleteProjectDialogOpen(false),
    [setIsDeleteProjectDialogOpen]
  );

  return (
    <Stack sx={{ width: '100%' }} m={2} gap={2}>
      <DashboardBreadcrumbs dashboardProject={projectName} />
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <FolderPound fontSize={'large'} />
            <Typography variant="h1">{projectName}</Typography>
          </Stack>
          <CRUDButton text="Delete Project" variant="outlined" color="error" onClick={handleDeleteProjectDialogOpen} />
          <DeleteProjectDialog
            name={projectName}
            open={isDeleteProjectDialogOpen}
            onClose={handleDeleteProjectDialogClose}
            onSuccess={handleDeleteProjectDialogSuccess}
          />
        </Stack>
        <Grid container columnSpacing={8}>
          <Grid item xs={12} lg={8}>
            <ProjectDashboards projectName={projectName} id="main-dashboard-list" />
          </Grid>
          <Grid item xs={12} lg={4}>
            <RecentlyViewedDashboards projectName={projectName} id="recent-dashboard-list" />
          </Grid>
        </Grid>
      </Box>
    </Stack>
  );
}

export default ProjectView;
