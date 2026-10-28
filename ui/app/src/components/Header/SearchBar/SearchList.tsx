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

import { Alert, AlertTitle, Box, Button, Stack, Typography } from '@mui/material';
import type { KVSearchResult } from '@nexucis/kvsearch';
import type { DatasourceResource, GlobalDatasourceResource, ProjectResource, Resource } from '@perses-dev/client';
import { isProjectMetadata } from '@perses-dev/client';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';

import { ALL_RESOURCE_TYPES_TITLES, getTagDisplayValues } from './model';
import type { HighlightedDashboardResource, SearchItem, SearchListProps } from './model';
import { SearchDashboardItem } from './SearchDashboardItem';
import { SearchDatasourceItem } from './SearchDatasourceItem';
import { SearchGlobalDatasourceItem } from './SearchGlobalDatasourceItem';
import { SearchProjectItem } from './SearchProjectItem';

const SIZE_LIST = 10;

type SearchMatch = NonNullable<KVSearchResult<SearchItem>['matched']>[number];

interface PaginationState {
  results: Array<KVSearchResult<SearchItem>>;
  size: number;
}

const buildBoxSearchKey = (resource: Resource): string => {
  return isProjectMetadata(resource.metadata)
    ? `${resource.kind}-${resource.metadata.project}-${resource.metadata.name}`
    : `${resource.kind}-${resource.metadata.name}`;
};

const isTagMatch = (match: SearchMatch): match is SearchMatch & { value: string } => {
  return (
    match.path.length === 2 &&
    match.path[0] === 'metadata' &&
    match.path[1] === 'tags' &&
    typeof match.value === 'string'
  );
};

const getMatchingTagValues = (matched: KVSearchResult<SearchItem>['matched']): string[] => {
  return Array.from(new Set((matched ?? []).filter(isTagMatch).map((match) => match.value)));
};

const STATIC_SX = {
  flexColumn: { display: 'flex', flexDirection: 'column', flexShrink: 0, height: 'auto', minHeight: 0, minWidth: 0 },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 0.5,
    marginBottom: 1,
    marginLeft: 0.5,
  },
  resourceIcon: { marginRight: 0.5 },
  alert: { margin: 1 },
};

export function SearchList(props: SearchListProps): ReactElement | null {
  const { type, results: filteredList, error, handleClose, dashboardCounts, datasourceCounts } = props;
  const [pagination, setPagination] = useState<PaginationState>({ results: filteredList, size: SIZE_LIST });
  const currentSizeList = pagination.results === filteredList ? pagination.size : SIZE_LIST;

  const handleSeeMore = useCallback(() => {
    setPagination({ results: filteredList, size: currentSizeList + SIZE_LIST });
  }, [filteredList, currentSizeList]);

  if (error) {
    return (
      <Alert severity="error" sx={STATIC_SX.alert}>
        <AlertTitle>{`Failed to load ${ALL_RESOURCE_TYPES_TITLES[type].toLowerCase()}`}</AlertTitle>
        {error.message}
      </Alert>
    );
  }

  if (!filteredList.length) return null;

  return (
    <Box sx={STATIC_SX.flexColumn}>
      <Box sx={STATIC_SX.flexRow}>
        <Typography variant="h3">{`${ALL_RESOURCE_TYPES_TITLES[type]} (${filteredList.length})`}</Typography>
      </Box>
      <Stack display="flex" direction="column">
        {type === 'dashboards' &&
          filteredList.slice(0, currentSizeList).map((search) => {
            const matchedTags = getMatchingTagValues(search.matched);
            const tagsDisplayValue = getTagDisplayValues(search.original.metadata.tags, matchedTags);
            return (
              <SearchDashboardItem
                tagsDisplayValue={tagsDisplayValue}
                matchingResult={search.matched}
                handleClose={handleClose}
                key={`${buildBoxSearchKey(search.original)}`}
                resource={search.original as HighlightedDashboardResource}
              />
            );
          })}
        {type === 'datasources' &&
          filteredList.slice(0, currentSizeList).map((search) => {
            return (
              <SearchDatasourceItem
                matchingResult={search.matched}
                handleClose={handleClose}
                key={`${buildBoxSearchKey(search.original)}`}
                resource={search.original as DatasourceResource}
              />
            );
          })}
        {type === 'projects' &&
          filteredList.slice(0, currentSizeList).map((search) => {
            return (
              <SearchProjectItem
                matchingResult={search.matched}
                handleClose={handleClose}
                key={`${buildBoxSearchKey(search.original)}`}
                resource={search.original as ProjectResource}
                datasourceCount={datasourceCounts?.get((search.original as ProjectResource).metadata.name) ?? 0}
                dashboardCount={dashboardCounts?.get((search.original as ProjectResource).metadata.name) ?? 0}
              />
            );
          })}
        {type === 'globalDatasources' &&
          filteredList.slice(0, currentSizeList).map((search) => {
            return (
              <SearchGlobalDatasourceItem
                matchingResult={search.matched}
                handleClose={handleClose}
                key={`${buildBoxSearchKey(search.original)}`}
                resource={search.original as GlobalDatasourceResource}
              />
            );
          })}
        {filteredList.length > currentSizeList && <Button onClick={handleSeeMore}>see more...</Button>}
      </Stack>
    </Box>
  );
}
