// Copyright The Perses Authors
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

import { Box, Stack } from '@mui/material';
import { ReactElement, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSelector, ProjectResource } from '@perses-dev/core';
import { CreateProjectDialog, CreateDashboardDialog } from '../../components/dialogs';
import { useIsMobileSize } from '../../utils/browser-size';
import { useDashboardCreateAllowedProjects } from '../../context/Authorization';
import { useIsEphemeralDashboardEnabled } from '../../context/Config';
import { RecentDashboards } from './RecentDashboards';
import { Projects } from './Projects';
import { ImportantDashboards } from './ImportantDashboards';
import { HomeViewHeroSection } from './HomeViewHeroSection';

function HomeView(): ReactElement {
  // Navigate to the project page if the project has been successfully added
  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();
  const userProjects = useDashboardCreateAllowedProjects();
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();

  const handleAddProjectDialogSubmit = (entity: ProjectResource): void => navigate(`/projects/${entity.metadata.name}`);
  const handleAddDashboardDialogSubmit = (dashboardSelector: DashboardSelector): void =>
    navigate(`/projects/${dashboardSelector.project}/dashboard/new`, {
      state: { name: dashboardSelector.dashboard, tags: dashboardSelector.tags },
    });

  // Open/Close management for dialogs
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddDashboardDialogOpen, setIsAddDashboardDialogOpen] = useState(false);

  const handleAddProjectDialogOpen = (): void => {
    setIsAddProjectDialogOpen(true);
  };
  const handleAddProjectDialogClose = (): void => {
    setIsAddProjectDialogOpen(false);
  };
  const handleAddDashboardDialogOpen = (): void => {
    setIsAddDashboardDialogOpen(true);
  };
  const handleAddDashboardDialogClose = (): void => {
    setIsAddDashboardDialogOpen(false);
  };

  return (
    <Stack sx={{ width: '100%', overflowX: 'hidden' }} m={isMobileSize ? 1 : 2} gap={4}>
      <Stack gap={3}>
        <HomeViewHeroSection
          userProjects={userProjects}
          onAddProjectClick={handleAddProjectDialogOpen}
          onAddDashboardClick={handleAddDashboardDialogOpen}
        />
        <CreateProjectDialog
          open={isAddProjectDialogOpen}
          onClose={handleAddProjectDialogClose}
          onSuccess={handleAddProjectDialogSubmit}
        />
        <CreateDashboardDialog
          open={isAddDashboardDialogOpen}
          projects={userProjects}
          onClose={handleAddDashboardDialogClose}
          onSuccess={handleAddDashboardDialogSubmit}
          isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
        />
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {/* Important Dashboards - Spans 2 columns */}
        <Box sx={{ gridColumn: { lg: 'span 2' } }}>
          <ImportantDashboards />
        </Box>

        {/* Recent Dashboards - 1 column */}
        <Box>
          <RecentDashboards />
        </Box>
      </Box>
      <Box mt={3} mb={3}>
        <Projects />
      </Box>
    </Stack>
  );
}

export default HomeView;
