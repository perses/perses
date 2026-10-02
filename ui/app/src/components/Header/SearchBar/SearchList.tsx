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

import { Box, Button, Stack, Typography } from '@mui/material';
import type { KVSearchConfiguration, KVSearchResult } from '@nexucis/kvsearch';
import { KVSearch } from '@nexucis/kvsearch';
import type { DatasourceResource, GlobalDatasourceResource, ProjectResource, Resource } from '@perses-dev/client';
import { isProjectMetadata } from '@perses-dev/client';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { HighlightedDashboardResource, SearchItem, SearchListProps } from './model';
import { SearchDashboardItem } from './SearchDashboardItem';
import { SearchDatasourceItem } from './SearchDatasourceItem';
import { SearchGlobalDatasourceItem } from './SearchGlobalDatasourceItem';
import { SearchProjectItem } from './SearchProjectItem';

const kvSearchConfig: KVSearchConfiguration = {
  indexedKeys: [
    ['metadata', 'name'],
    ['metadata', 'tags'],
  ],
  shouldSort: true,
  includeMatches: true,
  shouldRender: false,
  excludedChars: [' '],
};

const SIZE_LIST = 10;

interface PaginationState {
  list: SearchItem[];
  query: string;
  size: number;
}

function buildBoxSearchKey(resource: Resource): string {
  return isProjectMetadata(resource.metadata)
    ? `${resource.kind}-${resource.metadata.project}-${resource.metadata.name}`
    : `${resource.kind}-${resource.metadata.name}`;
}

const staticSx = {
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
};

export function SearchList(props: SearchListProps): ReactElement | null {
  const { list, query, handleClose, isResource } = props;
  const [pagination, setPagination] = useState<PaginationState>({ list, query, size: SIZE_LIST });
  const currentSizeList = pagination.list === list && pagination.query === query ? pagination.size : SIZE_LIST;
  const kvSearch = useMemo(() => new KVSearch<Resource>(kvSearchConfig), []);

  const filteredList: Array<KVSearchResult<SearchItem>> = useMemo(() => {
    return query ? kvSearch.filter(query, list) : [];
  }, [kvSearch, list, query]);

  const originalKind = useMemo(() => {
    if (!filteredList.length) return undefined;
    return filteredList[0]?.original.kind;
  }, [filteredList]);

  useEffect(() => {
    isResource?.(!!filteredList.length);
  }, [filteredList.length, isResource]);

  const handleSeeMore = useCallback(() => {
    setPagination({ list, query, size: currentSizeList + SIZE_LIST });
  }, [list, query, currentSizeList]);

  if (!filteredList.length) return null;

  return (
    <Box sx={staticSx.flexColumn}>
      <Box sx={staticSx.flexRow}>
        <Typography variant="h3">{`${filteredList[0]?.original.kind}s (${filteredList.length})`}</Typography>
      </Box>
      <Stack display="flex" direction="column">
        {originalKind === 'Dashboard' &&
          filteredList
            .slice(0, currentSizeList)
            .map(({ original }) => (
              <SearchDashboardItem
                handleClose={handleClose}
                key={`${buildBoxSearchKey(original)}`}
                resource={original as HighlightedDashboardResource}
              />
            ))}
        {originalKind === 'Datasource' &&
          filteredList
            .slice(0, currentSizeList)
            .map(({ original }) => (
              <SearchDatasourceItem
                handleClose={handleClose}
                key={`${buildBoxSearchKey(original)}`}
                resource={original as DatasourceResource}
              />
            ))}
        {originalKind === 'Project' &&
          filteredList
            .slice(0, currentSizeList)
            .map(({ original }) => (
              <SearchProjectItem
                handleClose={handleClose}
                key={`${buildBoxSearchKey(original)}`}
                resource={original as ProjectResource}
              />
            ))}
        {originalKind === 'GlobalDatasource' &&
          filteredList
            .slice(0, currentSizeList)
            .map(({ original }) => (
              <SearchGlobalDatasourceItem
                handleClose={handleClose}
                key={`${buildBoxSearchKey(original)}`}
                resource={original as GlobalDatasourceResource}
              />
            ))}
        {filteredList.length > currentSizeList && <Button onClick={handleSeeMore}>see more...</Button>}
      </Stack>
    </Box>
  );
}
