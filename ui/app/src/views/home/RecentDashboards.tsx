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

import { Box, CircularProgress, Divider, IconButton, Stack } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { intlFormatDistance } from 'date-fns';
import Archive from 'mdi-material-ui/Archive';
import Close from 'mdi-material-ui/Close';
import HistoryIcon from 'mdi-material-ui/History';
import ViewDashboardOutline from 'mdi-material-ui/ViewDashboardOutline';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useNavHistoryDispatch } from '../../context/DashboardNavHistory';
import { useRecentDashboardList } from '../../model/dashboard-client';
import { HomeListCard } from './HomeListCard';
import { HomeListItem } from './HomeListItem';

export function RecentDashboards(): ReactElement {
  const { data, isLoading } = useRecentDashboardList();
  const navHistoryDispatch = useNavHistoryDispatch();

  const dashboards = useMemo(() => data ?? [], [data]);

  const handleRemove = (project: string, name: string): void => {
    navHistoryDispatch({ type: 'remove', project, name });
  };

  return (
    <HomeListCard
      icon={<HistoryIcon sx={{ color: 'primary.main' }} />}
      title="Recently Viewed Dashboards"
      description="Jump back into the dashboards you opened most recently."
      centerContent={dashboards.length === 0 && !isLoading}
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
          <Box
            id="recent-dashboard-list"
            sx={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflowY: 'auto' }}
          >
            {dashboards.map((item, index) => {
              const updatedAt = item.date ?? item.dashboard.metadata.updatedAt;
              const relativeTime = updatedAt ? intlFormatDistance(new Date(updatedAt), new Date()) : 'moments ago';
              const displayName = item.dashboard.spec.display?.name ?? item.dashboard.metadata.name;
              const dashboardKey = `${item.dashboard.metadata.project}-${item.dashboard.metadata.name}-${index}`;

              return (
                <Box key={dashboardKey}>
                  <HomeListItem
                    to={`/projects/${item.dashboard.metadata.project}/dashboards/${item.dashboard.metadata.name}`}
                    ariaLabel={`${item.dashboard.metadata.project} ${item.dashboard.metadata.name}`}
                    title={displayName}
                    subtitle={`${item.dashboard.metadata.project} • ${relativeTime}`}
                    icon={<ViewDashboardOutline sx={{ fontSize: 16, color: 'primary.contrastText' }} />}
                    subtitleIcon={<Archive sx={{ fontSize: 12, color: 'text.secondary' }} />}
                    action={
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(item.dashboard.metadata.project, item.dashboard.metadata.name)}
                        aria-label={`Remove ${displayName} from recent list`}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    }
                  />
                  {index < dashboards.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
        )}
      </ErrorBoundary>
    </HomeListCard>
  );
}
