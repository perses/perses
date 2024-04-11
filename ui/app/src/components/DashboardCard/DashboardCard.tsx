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

import { Button, Stack, Typography } from '@mui/material';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import { DashboardResource, getResourceDisplayName } from '@perses-dev/core';
import Archive from 'mdi-material-ui/Archive';
import { Link as RouterLink } from 'react-router-dom';

interface DashboardCardProps {
  dashboard: DashboardResource;
  hideIcon?: boolean;
}

export function DashboardCard({ dashboard, hideIcon }: DashboardCardProps) {
  return (
    <Button
      variant="contained"
      fullWidth
      sx={{
        justifyContent: 'start',
        backgroundColor: (theme) => theme.palette.designSystem.blue[700],
      }}
      title={getResourceDisplayName(dashboard)}
      component={RouterLink}
      to={`/projects/${dashboard.metadata.project}/dashboards/${dashboard.metadata.name}`}
      data-testid={`dashboard-card-${dashboard.metadata.project}-${dashboard.metadata.name}`}
    >
      <Stack
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          width: '100%',
          overflowX: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {!hideIcon && <ViewDashboardIcon />}
        <Stack sx={{ flexDirection: 'column', maxWidth: '90%' }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'start',
              overflowX: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={getResourceDisplayName(dashboard)}
          >
            {getResourceDisplayName(dashboard)}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              textAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              overflowX: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
            title={dashboard.metadata.project}
          >
            <Archive fontSize={'small'} /> {dashboard.metadata.project}
          </Typography>
        </Stack>
      </Stack>
    </Button>
  );
}
