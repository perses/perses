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
import type { SxProps, Theme } from '@mui/material/styles';
import { intlFormatDistance } from 'date-fns';
import ArchiveOutline from 'mdi-material-ui/ArchiveOutline';
import StarFourPointsOutline from 'mdi-material-ui/StarFourPointsOutline';
import ViewDashboardOutline from 'mdi-material-ui/ViewDashboardOutline';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import type { ImportantDashboardEntryData, ImportantDashboardGroupData } from '../../model/dashboard-client';
import { useImportantDashboardGroupsData } from '../../model/dashboard-client';

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
} satisfies SxProps<Theme>;

const cardHeaderSx = {
  flex: '0 0 auto',
} satisfies SxProps<Theme>;

const cardBodySx = {
  flex: '1 1 auto',
  pt: 0,
  minHeight: 0,
} satisfies SxProps<Theme>;

const emptyCardBodySx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} satisfies SxProps<Theme>;

const titleRowSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
} satisfies SxProps<Theme>;

const titleIconSx = {
  color: 'primary.main',
} satisfies SxProps<Theme>;

const entryLinkSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  py: 1.5,
  px: 1,
  borderRadius: 1.5,
  textDecoration: 'none',
  color: 'inherit',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  '&:hover': {
    bgcolor: 'action.hover',
  },
} satisfies SxProps<Theme>;

const entryIconContainerSx = {
  p: 1.25,
  borderRadius: 1.5,
  bgcolor: 'primary.main',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} satisfies SxProps<Theme>;

const entryTextContainerSx = {
  flex: 1,
  minWidth: 0,
} satisfies SxProps<Theme>;

const entryPrimaryTextSx = {
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} satisfies SxProps<Theme>;

const loadingSx = {
  alignItems: 'center',
  justifyContent: 'center',
} satisfies SxProps<Theme>;

const emptyStateSx = {
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  px: 2,
} satisfies SxProps<Theme>;

const emptyStateIconSx = {
  fontSize: 32,
  color: 'text.secondary',
} satisfies SxProps<Theme>;

const groupsContainerSx = {
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 360,
  overflowY: 'auto',
} satisfies SxProps<Theme>;

const groupHeaderSx = {
  mb: 1.5,
} satisfies SxProps<Theme>;

const groupTitleSx = {
  fontWeight: 600,
} satisfies SxProps<Theme>;

const entryIconSx = {
  fontSize: 16,
  color: 'primary.contrastText',
} satisfies SxProps<Theme>;

const groupDividerSx = {
  my: 2,
} satisfies SxProps<Theme>;

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

function ImportantDashboardEntryLink(props: {
  Icon: typeof ArchiveOutline | typeof ViewDashboardOutline;
  to: string;
  primary: string;
  secondary: string;
  ariaLabel: string;
}): ReactElement {
  const { Icon, to, primary, secondary, ariaLabel } = props;

  return (
    <Box component={RouterLink} to={to} aria-label={ariaLabel} sx={entryLinkSx}>
      <Box sx={entryIconContainerSx}>
        <Icon sx={entryIconSx} />
      </Box>
      <Box sx={entryTextContainerSx}>
        <Typography variant="body1" sx={entryPrimaryTextSx}>
          {primary}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {secondary}
        </Typography>
      </Box>
    </Box>
  );
}

export function ImportantDashboards(): ReactElement | null {
  const { data: importantDashboardGroups, isLoading } = useImportantDashboardGroupsData();

  const groups = useMemo(
    () => importantDashboardGroups.filter((group) => group.entries.length > 0),
    [importantDashboardGroups],
  );
  const keyedGroups = useKeyedImportantDashboardGroups(groups);
  const bodySx = useMemo<SxProps<Theme>>(() => {
    if (groups.length === 0 && !isLoading) {
      return { ...cardBodySx, ...emptyCardBodySx };
    }
    return cardBodySx;
  }, [groups.length, isLoading]);

  if (importantDashboardGroups.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Card elevation={0} sx={cardSx} data-testid="important-dashboards-card">
      <CardContent sx={cardHeaderSx}>
        <Stack spacing={0.75}>
          <Box sx={titleRowSx}>
            <StarFourPointsOutline sx={titleIconSx} />
            <Typography variant="h6" sx={groupTitleSx}>
              Important Dashboards
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Curated dashboards configured for quick access.
          </Typography>
        </Stack>
      </CardContent>
      <CardContent sx={bodySx}>
        {isLoading && (
          <Stack width="100%" sx={loadingSx}>
            <CircularProgress size={24} />
          </Stack>
        )}
        {!isLoading && groups.length === 0 && (
          <Stack spacing={1} sx={emptyStateSx}>
            <StarFourPointsOutline sx={emptyStateIconSx} />
            <Typography variant="body1">No important dashboards found.</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure important dashboards in your config file.
            </Typography>
          </Stack>
        )}
        {!isLoading && keyedGroups.length > 0 && (
          <Box data-testid="important-dashboards-mosaic" sx={groupsContainerSx}>
            {keyedGroups.map((group, groupIndex) => {
              return (
                <Box key={group.key}>
                  <Stack spacing={0.5} sx={groupHeaderSx}>
                    {group.title !== undefined && (
                      <Typography variant="subtitle1" sx={groupTitleSx}>
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
                            <ImportantDashboardEntryLink
                              Icon={ArchiveOutline}
                              to={`/projects/${entry.project}`}
                              ariaLabel={entry.project}
                              primary={entry.project}
                              secondary={`${dashboardCount} ${dashboardCount === 1 ? 'dashboard' : 'dashboards'} in project`}
                            />
                            {entryIndex < group.keyedEntries.length - 1 && <Divider />}
                          </Box>
                        );
                      }

                      const metricsCount = Object.keys(entry.dashboard.spec.panels ?? {}).length;
                      const updatedAt = entry.dashboard.metadata.updatedAt ?? entry.dashboard.metadata.createdAt;
                      const relativeTime = updatedAt
                        ? intlFormatDistance(new Date(updatedAt), new Date())
                        : 'Recently updated';
                      const displayName = entry.dashboard.spec.display?.name ?? entry.dashboard.metadata.name;

                      return (
                        <Box key={key}>
                          <ImportantDashboardEntryLink
                            Icon={ViewDashboardOutline}
                            to={`/projects/${entry.dashboard.metadata.project}/dashboards/${entry.dashboard.metadata.name}`}
                            ariaLabel={`${entry.dashboard.metadata.project} ${entry.dashboard.metadata.name}`}
                            primary={displayName}
                            secondary={`${entry.dashboard.metadata.project} • ${metricsCount} ${
                              metricsCount === 1 ? 'metric' : 'metrics'
                            } • ${relativeTime}`}
                          />
                          {entryIndex < group.keyedEntries.length - 1 && <Divider />}
                        </Box>
                      );
                    })}
                  </Box>
                  {groupIndex < keyedGroups.length - 1 && <Divider sx={groupDividerSx} />}
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
