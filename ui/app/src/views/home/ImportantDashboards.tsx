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

import { Box, Card, CardContent, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import StarFourPointsOutline from 'mdi-material-ui/StarFourPointsOutline';
import ViewDashboardOutline from 'mdi-material-ui/ViewDashboardOutline';
import { intlFormatDistance } from 'date-fns';
import { ReactElement, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useImportantDashboardList } from '../../model/dashboard-client';
import { useConfig } from '../../model/config-client';

const MAX_IMPORTANT_DASHBOARDS = 3;

export function ImportantDashboards(): ReactElement {
  const { data: config } = useConfig();
  const { data: dashboards, isLoading } = useImportantDashboardList();

  const dashboardList = useMemo(() => dashboards ?? [], [dashboards]);

  const previewDashboards = useMemo(() => dashboardList.slice(0, MAX_IMPORTANT_DASHBOARDS), [dashboardList]);

  const hasImportantDashboards = Boolean(config?.frontend.important_dashboards?.length && dashboardList.length > 0);

  if (!hasImportantDashboards) {
    return <></>;
  }

  return (
    <Card
      elevation={1}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <StarFourPointsOutline sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
            Important Dashboards
          </Typography>
        </Box>
      </CardContent>
      <CardContent sx={{ flex: '1 1 auto', overflowY: 'auto', pt: 0 }}>
        {isLoading ? (
          <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {previewDashboards.map((dashboard) => {
              const metricsCount = Object.keys(dashboard.spec.panels ?? {}).length;
              const updatedAt = dashboard.metadata.updatedAt ?? dashboard.metadata.createdAt;
              const relativeTime = updatedAt ? intlFormatDistance(new Date(updatedAt), new Date()) : 'Recently updated';
              const displayName = dashboard.spec.display?.name ?? dashboard.metadata.name;

              return (
                <Paper
                  key={`${dashboard.metadata.project}-${dashboard.metadata.name}`}
                  elevation={0}
                  variant="outlined"
                  component={RouterLink}
                  to={`/projects/${dashboard.metadata.project}/dashboards/${dashboard.metadata.name}`}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: (theme) => theme.shadows[2],
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        height: 'fit-content',
                        transition: 'all 0.2s',
                      }}
                    >
                      <ViewDashboardOutline sx={{ fontSize: 20, color: 'primary.main' }} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', mb: 0.5 }}
                      >
                        {displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dashboard.metadata.project} • {metricsCount} {metricsCount === 1 ? 'metric' : 'metrics'}
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start' }}>
                      {relativeTime}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
