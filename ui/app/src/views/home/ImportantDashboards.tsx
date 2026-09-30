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

import { Box, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { intlFormatDistance } from 'date-fns';
import Archive from 'mdi-material-ui/Archive';
import StarFourPointsOutline from 'mdi-material-ui/StarFourPointsOutline';
import ViewDashboardOutline from 'mdi-material-ui/ViewDashboardOutline';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useShouldNormalizeResourceNames } from '../../context/Config';
import { useImportantDashboardGroupsData } from '../../model/dashboard-client';
import { useProjectList } from '../../model/project-client';
import { HomeListCard } from './HomeListCard';
import { HomeListItem } from './HomeListItem';

export function ImportantDashboards(): ReactElement {
  const { data: importantDashboardGroups, isLoading } = useImportantDashboardGroupsData();
  const { data: projects } = useProjectList();
  const shouldNormalizeResourceNames = useShouldNormalizeResourceNames();

  const groups = useMemo(
    () => importantDashboardGroups.filter((group) => group.entries.length > 0),
    [importantDashboardGroups],
  );

  const projectDisplayNames = useMemo(() => {
    return new Map(
      (projects ?? []).map((project) => [
        shouldNormalizeResourceNames ? project.metadata.name.toLowerCase() : project.metadata.name,
        project.spec?.display?.name,
      ]),
    );
  }, [projects, shouldNormalizeResourceNames]);

  return (
    <HomeListCard
      testId="important-dashboards-card"
      icon={<StarFourPointsOutline sx={{ color: 'primary.main' }} />}
      title="Important Dashboards"
      description="Curated dashboards configured for quick access."
      centerContent={groups.length === 0 && !isLoading}
    >
      {isLoading && (
        <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Stack>
      )}
      {!isLoading && groups.length === 0 && (
        <EmptyState
          icon={<StarFourPointsOutline sx={{ fontSize: 32, color: 'text.secondary' }} />}
          message="No important dashboards found."
          hint="Configure important dashboards in your config file."
        />
      )}
      {!isLoading && groups.length > 0 && (
        <Box
          data-testid="important-dashboards-mosaic"
          sx={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflowY: 'auto' }}
        >
          {groups.map((group, groupIndex) => {
            return (
              <Box key={groupIndex}>
                <Stack spacing={0.5} sx={{ mb: group.title !== undefined ? 1 : 0 }}>
                  {group.title !== undefined && (
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {group.title}
                    </Typography>
                  )}
                  {group.description !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      {group.description}
                    </Typography>
                  )}
                </Stack>
                <Box>
                  {group.entries.map((entry, entryIndex) => {
                    if (entry.kind === 'project') {
                      const dashboardCount = entry.dashboards.length;
                      const projectDisplayName =
                        projectDisplayNames.get(
                          shouldNormalizeResourceNames ? entry.project.toLowerCase() : entry.project,
                        ) ?? entry.project;
                      return (
                        <Box key={entryIndex}>
                          <HomeListItem
                            to={`/projects/${entry.project}`}
                            ariaLabel={entry.project}
                            title={projectDisplayName}
                            subtitle={`${dashboardCount} ${dashboardCount === 1 ? 'dashboard' : 'dashboards'} in project`}
                            icon={<Archive sx={{ fontSize: 16, color: 'primary.main' }} />}
                            iconVariant="outlined"
                          />
                          {entryIndex < group.entries.length - 1 && <Divider />}
                        </Box>
                      );
                    }

                    const updatedAt = entry.dashboard.metadata.updatedAt ?? entry.dashboard.metadata.createdAt;
                    const relativeTime = updatedAt
                      ? intlFormatDistance(new Date(updatedAt), new Date())
                      : 'Recently updated';
                    const displayName = entry.dashboard.spec.display?.name ?? entry.dashboard.metadata.name;

                    return (
                      <Box key={entryIndex}>
                        <HomeListItem
                          to={`/projects/${entry.dashboard.metadata.project}/dashboards/${entry.dashboard.metadata.name}`}
                          ariaLabel={`${entry.dashboard.metadata.project} ${entry.dashboard.metadata.name}`}
                          title={displayName}
                          subtitle={`${entry.dashboard.metadata.project} • ${relativeTime}`}
                          icon={<ViewDashboardOutline sx={{ fontSize: 16, color: 'primary.contrastText' }} />}
                          subtitleIcon={<Archive sx={{ fontSize: 12, color: 'text.secondary' }} />}
                        />
                        {entryIndex < group.entries.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Box>
                {groupIndex < groups.length - 1 && <Divider sx={{ mb: 2 }} />}
              </Box>
            );
          })}
        </Box>
      )}
    </HomeListCard>
  );
}
