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

import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { ReactElement } from 'react';
import ViewDashboardOutlineIcon from 'mdi-material-ui/ViewDashboardOutline';
import PlusIcon from 'mdi-material-ui/Plus';
import UploadIcon from 'mdi-material-ui/Upload';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { ProjectResource } from '@perses-dev/core';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { ImportRoute } from '../../model/route';
import { useInformation } from '../../context/Config';

interface HomeViewHeroSectionProps {
  userProjects: ProjectResource[];
  onAddProjectClick: () => void;
  onAddDashboardClick: () => void;
}

export function HomeViewHeroSection({
  userProjects,
  onAddProjectClick,
  onAddDashboardClick,
}: HomeViewHeroSectionProps): ReactElement {
  const information = useInformation();
  const canCreateDashboards = userProjects.length > 0;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        borderRadius: 3,
        px: { xs: 3, md: 4 },
        py: { xs: 3, md: 4 },
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

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) auto' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Box sx={{ maxWidth: 760, minWidth: 0 }}>
          {information ? (
            <Box
              sx={{
                lineHeight: 1.5,
                '& *': { marginTop: 0 },
              }}
              dangerouslySetInnerHTML={{ __html: information }}
            />
          ) : (
            <Stack spacing={1.5}>
              <Chip
                label="Quick start"
                color="primary"
                variant="outlined"
                size="small"
                sx={{ alignSelf: 'flex-start', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5) }}
              />
              <Typography variant="h2" sx={{ fontWeight: 700, maxWidth: 16 * 28 }}>
                Pick up where you left off in Perses.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, maxWidth: 16 * 42 }}>
                Create a project, start a new dashboard, or jump back into the views that matter most to your team.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userProjects.length === 0
                  ? 'Create your first project to unlock dashboard creation and imports.'
                  : `${userProjects.length} ${userProjects.length === 1 ? 'project is' : 'projects are'} ready for new dashboards.`}
              </Typography>
            </Stack>
          )}
        </Box>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            flexWrap: 'wrap',
            alignItems: 'center',
            justifySelf: { lg: 'end' },
            pt: { lg: 0.5 },
          }}
        >
          <Button
            variant="contained"
            size="medium"
            startIcon={<ViewDashboardOutlineIcon />}
            onClick={onAddDashboardClick}
            disabled={!canCreateDashboards}
            sx={{ px: 2.5 }}
          >
            Create Dashboard
          </Button>
          <CRUDButton
            action="create"
            scope="Project"
            variant="outlined"
            size="medium"
            startIcon={<PlusIcon />}
            onClick={onAddProjectClick}
            sx={{ px: 2.5 }}
          >
            Create Project
          </CRUDButton>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<UploadIcon />}
            component={RouterLink}
            to={ImportRoute}
            disabled={!canCreateDashboards}
            sx={{ px: 2.5 }}
          >
            Import Dashboard
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
