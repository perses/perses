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
import HistoryIcon from 'mdi-material-ui/History';
import ViewDashboardOutline from 'mdi-material-ui/ViewDashboardOutline';
import Archive from 'mdi-material-ui/Archive';
import { ReactElement, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { intlFormatDistance } from 'date-fns';
import { useRecentDashboardList } from '../../model/dashboard-client';
import { EmptyState } from '../../components/EmptyState/EmptyState';

export function RecentDashboards(): ReactElement {
  const { data, isLoading } = useRecentDashboardList();

  const dashboards = useMemo(() => data ?? [], [data]);

  return (
    <Card
      elevation={1}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        maxHeight: 600,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flex: '0 0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <HistoryIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
            Recently Viewed Dashboards
          </Typography>
        </Box>
      </CardContent>
      <CardContent
        sx={{
          flex: '1 1 auto',
          overflowY: 'auto',
          pt: 0,
          minHeight: 0,
          ...(dashboards.length === 0 && !isLoading
            ? {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }
            : {}),
        }}
      >
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          {isLoading && (
            <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Stack>
          )}
          {!isLoading && dashboards.length === 0 && (
            <EmptyState
              icon={<HistoryIcon sx={{ fontSize: 32, color: 'text.secondary' }} />}
              message="No dashboards viewed yet."
              hint="Your recently viewed dashboards will appear here."
            />
          )}
          {!isLoading && dashboards.length > 0 && (
            <Box id="recent-dashboard-list" sx={{ display: 'flex', flexDirection: 'column' }}>
              {dashboards.map((item, index) => {
                const updatedAt = item.date ?? item.dashboard.metadata.updatedAt;
                const relativeTime = updatedAt ? intlFormatDistance(new Date(updatedAt), new Date()) : 'moments ago';
                const displayName = item.dashboard.spec.display?.name ?? item.dashboard.metadata.name;
                const dashboardKey = `${item.dashboard.metadata.project}-${item.dashboard.metadata.name}-${index}`;

                return (
                  <Box key={dashboardKey}>
                    <Box
                      component={RouterLink}
                      to={`/projects/${item.dashboard.metadata.project}/dashboards/${item.dashboard.metadata.name}`}
                      role="row"
                      aria-label={`${item.dashboard.metadata.project} ${item.dashboard.metadata.name}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 2,
                        pl: 1,
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
                          p: 1,
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
                          variant="body2"
                          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {displayName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Archive sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {item.dashboard.metadata.project} • {relativeTime}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {index < dashboards.length - 1 && <Divider />}
                  </Box>
                );
              })}
            </Box>
          )}
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}
