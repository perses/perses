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
import { Box, Stack, Grid } from '@mui/material';
import { useCallback, useState } from 'react';
import { DeleteProjectDialog } from '../../components/dialogs';
import ProjectBreadcrumbs from '../../components/breadcrumbs/ProjectBreadcrumbs';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { RecentlyViewedDashboards } from './RecentlyViewedDashboards';
import { ProjectTabs } from './ProjectTabs';

function ProjectView() {
  const { projectName, tab } = useParams();
  if (projectName === undefined) {
    throw new Error('Unable to get the project name');
  }

  // Navigate to the home page if the project has been successfully deleted
  const navigate = useNavigate();

  const handleDeleteProjectDialogSuccess = useCallback(() => navigate(`/`), [navigate]);

  // Open/Close management for the "Delete Project" dialog
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState<boolean>(false);

  return (
    <Stack sx={{ width: '100%' }} mx={2} mb={2} mt={1.5} gap={1}>
      <Box display="flex" justifyContent="space-between">
        <ProjectBreadcrumbs projectName={projectName} />
        <Box mt={0.5}>
          <CRUDButton
            text="Delete Project"
            variant="outlined"
            color="error"
            onClick={() => setIsDeleteProjectDialogOpen(true)}
          />
        </Box>
        <DeleteProjectDialog
          name={projectName}
          open={isDeleteProjectDialogOpen}
          onClose={() => setIsDeleteProjectDialogOpen(false)}
          onSuccess={handleDeleteProjectDialogSuccess}
        />
      </Box>
      <Grid container columnSpacing={8}>
        <Grid item xs={12} lg={8}>
          <ProjectTabs projectName={projectName} initialTab={tab} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <RecentlyViewedDashboards projectName={projectName} id="recent-dashboard-list" />
        </Grid>
      </Grid>
    </Stack>
  );
}

export default ProjectView;
