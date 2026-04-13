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

import { Box, Card, CardContent, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import StarFourPointsOutline from 'mdi-material-ui/StarFourPointsOutline';
import ViewDashboardOutline from 'mdi-material-ui/ViewDashboardOutline';
import { intlFormatDistance } from 'date-fns';
import { ReactElement, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useImportantDashboardList } from '../../model/dashboard-client';
import { useConfig } from '../../model/config-client';
import { EmptyState } from '../../components/EmptyState/EmptyState';

export function ImportantDashboards(): ReactElement {
  const { data: config } = useConfig();
  const { data: dashboards, isLoading } = useImportantDashboardList();

  const dashboardList = useMemo(() => dashboards ?? [], [dashboards]);

  const hasImportantDashboardsConfig = Boolean(config?.frontend.important_dashboards?.length);

  if (!hasImportantDashboardsConfig) {
    return <></>;
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid="important-dashboards-card"
    >
      <CardContent sx={{ flex: '0 0 auto' }}>
        <Stack spacing={0.75}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarFourPointsOutline sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
              Important Dashboards
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Curated dashboards configured for quick access.
          </Typography>
        </Stack>
      </CardContent>
      <CardContent
        sx={{
          flex: '1 1 auto',
          pt: 0,
          minHeight: 0,
          ...(dashboardList.length === 0 && !isLoading
            ? {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }
            : {}),
        }}
      >
        {isLoading && (
          <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Stack>
        )}
        {!isLoading && dashboardList.length === 0 && (
          <EmptyState
            icon={<StarFourPointsOutline sx={{ fontSize: 32, color: 'text.secondary' }} />}
            message="No important dashboards found."
            hint="Configure important dashboards in your config file."
          />
        )}
        {!isLoading && dashboardList.length > 0 && (
          <Box
            data-testid="important-dashboards-mosaic"
            sx={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflowY: 'auto' }}
          >
            {dashboardList.map((dashboard, index) => {
              const metricsCount = Object.keys(dashboard.spec.panels ?? {}).length;
              const updatedAt = dashboard.metadata.updatedAt ?? dashboard.metadata.createdAt;
              const relativeTime = updatedAt ? intlFormatDistance(new Date(updatedAt), new Date()) : 'Recently updated';
              const displayName = dashboard.spec.display?.name ?? dashboard.metadata.name;
              const dashboardKey = `${dashboard.metadata.project}-${dashboard.metadata.name}`;

              return (
                <Box key={dashboardKey}>
                  <Box
                    component={RouterLink}
                    to={`/projects/${dashboard.metadata.project}/dashboards/${dashboard.metadata.name}`}
                    role="row"
                    aria-label={`${dashboard.metadata.project} ${dashboard.metadata.name}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 2,
                      px: 1,
                      borderRadius: 1.5,
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ViewDashboardOutline sx={{ fontSize: 16, color: 'primary.contrastText' }} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {displayName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {dashboard.metadata.project} • {metricsCount} {metricsCount === 1 ? 'metric' : 'metrics'} •{' '}
                          {relativeTime}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {index < dashboardList.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
