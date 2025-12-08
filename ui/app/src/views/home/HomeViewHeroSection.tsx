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

import { Box, Button, Typography } from '@mui/material';
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

  return (
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

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <Box sx={{ maxWidth: 800, flex: 1 }}>
          {information ? (
            <Box
              sx={{
                lineHeight: 1.5,
                '& *': { marginTop: 0 },
              }}
              dangerouslySetInnerHTML={{ __html: information }}
            />
          ) : (
            <>
              <Typography variant="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Welcome to Perses
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                Build, monitor, and analyze dashboards with enterprise-grade performance. Access your most important
                telemetry in real-time.
              </Typography>
            </>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            flexShrink: 0,
            alignSelf: 'flex-start',
          }}
        >
          <CRUDButton
            action="create"
            scope="Project"
            variant="contained"
            size="medium"
            startIcon={<PlusIcon />}
            onClick={onAddProjectClick}
            sx={{ px: 3 }}
          >
            Create Project
          </CRUDButton>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<ViewDashboardOutlineIcon />}
            onClick={onAddDashboardClick}
            disabled={userProjects.length === 0}
            sx={{ px: 3 }}
          >
            New Dashboard
          </Button>
          <Button
            variant="outlined"
            size="medium"
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
  );
}
