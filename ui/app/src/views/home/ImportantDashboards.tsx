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
import { intlFormatDistance } from 'date-fns';
import Archive from 'mdi-material-ui/Archive';
import StarFourPointsOutline from 'mdi-material-ui/StarFourPointsOutline';
import ViewDashboardOutline from 'mdi-material-ui/ViewDashboardOutline';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useImportantDashboardGroups } from '../../context/Config';
import type { ImportantDashboardEntryData, ImportantDashboardGroupData } from '../../model/dashboard-client';
import { useImportantDashboardGroupsData } from '../../model/dashboard-client';
import { HomeListItem } from './HomeListItem';

function buildGroupKey(group: ImportantDashboardGroupData): string {
  const entryKeys = group.entries.map(buildEntryBaseKey).join('|');
  return `${group.title ?? ''}-${group.description ?? ''}-${entryKeys}`;
}

function buildEntryBaseKey(entry: ImportantDashboardEntryData): string {
  if (entry.kind === 'project') {
    return `project-${entry.project}`;
  }
  return `dashboard-${entry.dashboard.metadata.project}-${entry.dashboard.metadata.name}`;
}

function useKeyedImportantDashboardGroups(groups: ImportantDashboardGroupData[]): Array<
  ImportantDashboardGroupData & {
    key: string;
    keyedEntries: Array<{
      key: string;
      entry: ImportantDashboardEntryData;
    }>;
  }
> {
  return useMemo(() => {
    const groupKeyCounts = new Map<string, number>();

    return groups.map((group) => {
      const groupBaseKey = buildGroupKey(group);
      const groupDuplicateCount = groupKeyCounts.get(groupBaseKey) ?? 0;
      groupKeyCounts.set(groupBaseKey, groupDuplicateCount + 1);

      const entryKeyCounts = new Map<string, number>();
      const keyedEntries = group.entries.map((entry) => {
        const entryBaseKey = buildEntryBaseKey(entry);
        const entryDuplicateCount = entryKeyCounts.get(entryBaseKey) ?? 0;
        entryKeyCounts.set(entryBaseKey, entryDuplicateCount + 1);

        return {
          key: entryDuplicateCount === 0 ? entryBaseKey : `${entryBaseKey}-${entryDuplicateCount}`,
          entry,
        };
      });

      return {
        title: group.title,
        description: group.description,
        entries: group.entries,
        key: groupDuplicateCount === 0 ? groupBaseKey : `${groupBaseKey}-${groupDuplicateCount}`,
        keyedEntries,
      };
    });
  }, [groups]);
}

export function ImportantDashboards(): ReactElement | null {
  const configuredImportantDashboardGroups = useImportantDashboardGroups();
  const { data: importantDashboardGroups, isLoading } = useImportantDashboardGroupsData();
  const hasConfiguredImportantDashboards = useMemo(() => {
    return configuredImportantDashboardGroups.some((group) => (group.dashboards?.length ?? 0) > 0);
  }, [configuredImportantDashboardGroups]);

  const groups = useMemo(
    () => importantDashboardGroups.filter((group) => group.entries.length > 0),
    [importantDashboardGroups],
  );
  const keyedGroups = useKeyedImportantDashboardGroups(groups);

  if (!hasConfiguredImportantDashboards && !isLoading) {
    return null;
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
          ...(groups.length === 0 && !isLoading
            ? { display: 'flex', alignItems: 'center', justifyContent: 'center' }
            : {}),
        }}
      >
        {isLoading && (
          <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Stack>
        )}
        {!isLoading && groups.length === 0 && (
          <Stack
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}
          >
            <StarFourPointsOutline sx={{ fontSize: 32, color: 'text.secondary' }} />
            <Typography variant="body1">No important dashboards found.</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure important dashboards in your config file.
            </Typography>
          </Stack>
        )}
        {!isLoading && keyedGroups.length > 0 && (
          <Box
            data-testid="important-dashboards-mosaic"
            sx={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflowY: 'auto' }}
          >
            {keyedGroups.map((group, groupIndex) => {
              return (
                <Box key={group.key}>
                  <Stack spacing={0.5} sx={{ mb: 1.5 }}>
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
                    {group.keyedEntries.map(({ key, entry }, entryIndex) => {
                      if (entry.kind === 'project') {
                        const dashboardCount = entry.dashboards.length;
                        return (
                          <Box key={key}>
                            <HomeListItem
                              to={`/projects/${entry.project}`}
                              ariaLabel={entry.project}
                              title={entry.project}
                              subtitle={`${dashboardCount} ${dashboardCount === 1 ? 'dashboard' : 'dashboards'} in project`}
                              icon={<Archive sx={{ fontSize: 16, color: 'primary.main' }} />}
                              iconVariant="outlined"
                            />
                            {entryIndex < group.keyedEntries.length - 1 && <Divider />}
                          </Box>
                        );
                      }

                      const updatedAt = entry.dashboard.metadata.updatedAt ?? entry.dashboard.metadata.createdAt;
                      const relativeTime = updatedAt
                        ? intlFormatDistance(new Date(updatedAt), new Date())
                        : 'Recently updated';
                      const displayName = entry.dashboard.spec.display?.name ?? entry.dashboard.metadata.name;

                      return (
                        <Box key={key}>
                          <HomeListItem
                            to={`/projects/${entry.dashboard.metadata.project}/dashboards/${entry.dashboard.metadata.name}`}
                            ariaLabel={`${entry.dashboard.metadata.project} ${entry.dashboard.metadata.name}`}
                            title={displayName}
                            subtitle={`${entry.dashboard.metadata.project} • ${relativeTime}`}
                            icon={<ViewDashboardOutline sx={{ fontSize: 16, color: 'primary.contrastText' }} />}
                            subtitleIcon={<Archive sx={{ fontSize: 12, color: 'text.secondary' }} />}
                          />
                          {entryIndex < group.keyedEntries.length - 1 && <Divider />}
                        </Box>
                      );
                    })}
                  </Box>
                  {groupIndex < keyedGroups.length - 1 && <Divider sx={{ mb: 2 }} />}
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
