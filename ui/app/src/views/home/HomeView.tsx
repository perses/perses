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

import { Box, Button, Stack, Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import ViewDashboardOutlineIcon from 'mdi-material-ui/ViewDashboardOutline';
import PlusIcon from 'mdi-material-ui/Plus';
import UploadIcon from 'mdi-material-ui/Upload';
import { alpha } from '@mui/material/styles';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { DashboardSelector, ProjectResource } from '@perses-dev/core';
import { CreateProjectDialog, CreateDashboardDialog } from '../../components/dialogs';
import { useIsMobileSize } from '../../utils/browser-size';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { ImportRoute } from '../../model/route';
import { useDashboardCreateAllowedProjects } from '../../context/Authorization';
import { useIsEphemeralDashboardEnabled } from '../../context/Config';
import { RecentDashboards } from './RecentDashboards';
import { ProjectsAndDashboards } from './ProjectsAndDashboards';
import { ImportantDashboards } from './ImportantDashboards';

function HomeView(): ReactElement {
  // Navigate to the project page if the project has been successfully added
  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();
  const userProjects = useDashboardCreateAllowedProjects();
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();

  const handleAddProjectDialogSubmit = (entity: ProjectResource): void => navigate(`/projects/${entity.metadata.name}`);
  const handleAddDashboardDialogSubmit = (dashboardSelector: DashboardSelector): void =>
    navigate(`/projects/${dashboardSelector.project}/dashboard/new`, { state: { name: dashboardSelector.dashboard } });

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
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            borderRadius: 3,
            px: { xs: 4, md: 6 },
            py: { xs: 4, md: 6 },
            background: (theme) => {
              if (theme.palette.mode === 'dark') {
                return `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.info?.main || theme.palette.primary.main, 0.05)} 100%)`;
              }
              return `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.info?.main || theme.palette.primary.main, 0.03)} 100%)`;
            },
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
            boxShadow: (theme) => theme.shadows[1],
          }}
        >
          {/* Decorative blur elements */}
          <Box
            sx={{
              position: 'absolute',
              right: -50,
              top: -50,
              width: 256,
              height: 256,
              bgcolor: 'primary.main',
              opacity: 0.05,
              borderRadius: '50%',
              filter: 'blur(60px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: -50,
              bottom: -50,
              width: 256,
              height: 256,
              bgcolor: (theme) => theme.palette.secondary?.main || theme.palette.primary.main,
              opacity: 0.05,
              borderRadius: '50%',
              filter: 'blur(60px)',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
            <Typography variant="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Welcome to Perses
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              Build, monitor, and analyze dashboards with enterprise-grade performance. Access your most important
              telemetry in real-time.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <CRUDButton
                action="create"
                scope="Project"
                variant="contained"
                size="large"
                startIcon={<PlusIcon />}
                onClick={handleAddProjectDialogOpen}
                sx={{ px: 3 }}
              >
                Create Project
              </CRUDButton>
              <Button
                variant="outlined"
                size="large"
                startIcon={<ViewDashboardOutlineIcon />}
                onClick={handleAddDashboardDialogOpen}
                disabled={userProjects.length === 0}
                sx={{ px: 3 }}
              >
                New Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<UploadIcon />}
                component={RouterLink}
                to={ImportRoute}
                disabled={userProjects.length === 0}
                sx={{ px: 3 }}
              >
                Import Dashboard
              </Button>
            </Box>
          </Box>
        </Box>
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
        <ProjectsAndDashboards />
      </Box>
    </Stack>
  );
}

export default HomeView;
