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

import type { Theme } from '@mui/material';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import type { KVSearchConfiguration, KVSearchResult } from '@nexucis/kvsearch';
import { KVSearch } from '@nexucis/kvsearch';
import type { DashboardResource, Kind, Resource } from '@perses-dev/client';
import { isProjectMetadata } from '@perses-dev/client';
import Archive from 'mdi-material-ui/Archive';
import MiddleAlertIcon from 'mdi-material-ui/StarFourPointsOutline';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import type { HighlightedDashboardResource, SearchItem, SearchListProps } from './model';
import { SearchDashboardItem } from './SearchDashbaordItem';

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
const MAX_VISIBLE_RESOURCE_TAGS = 3;
const matchedTagChipSx = {
  backgroundColor: (theme: Theme): string =>
    theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.18)' : 'rgba(255, 243, 205, 0.9)',
  borderColor: (theme: Theme): string =>
    theme.palette.mode === 'dark' ? theme.palette.warning.main : theme.palette.warning.dark,
  color: (theme: Theme): string =>
    theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark,
  fontWeight: 600,
};

type SearchMatch = NonNullable<KVSearchResult<SearchItem>['matched']>[number];
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

// function isTagMatch(match: SearchMatch): match is SearchMatch & { value: string } {
//   return (
//     match.path.length === 2 &&
//     match.path[0] === 'metadata' &&
//     match.path[1] === 'tags' &&
//     typeof match.value === 'string'
//   );
// }

// function getMatchingTagValues(matched: KVSearchResult<SearchItem>['matched']): string[] {
//   return Array.from(new Set((matched ?? []).filter(isTagMatch).map((match) => match.value)));
// }

// function getTagDisplayValues(
//   tags: string[] | undefined,
//   matchingTagValues: string[],
// ): {
//   normalizedMatchingTags: Set<string>;
//   visibleTags: string[];
//   hiddenTagsCount: number;
//   hasAnyTags: boolean;
// } {
//   const normalizedMatchingTags = new Set(matchingTagValues.map((tag) => tag.toLowerCase()));
//   const uniqueTags = Array.from(new Set(tags ?? []));
//   const matchedTags = uniqueTags.filter((tag) => normalizedMatchingTags.has(tag.toLowerCase()));
//   const unmatchedTags = uniqueTags.filter((tag) => !normalizedMatchingTags.has(tag.toLowerCase()));
//   const orderedTags = [...matchedTags, ...unmatchedTags];

//   return {
//     normalizedMatchingTags,
//     visibleTags: orderedTags.slice(0, MAX_VISIBLE_RESOURCE_TAGS),
//     hiddenTagsCount: Math.max(0, orderedTags.length - MAX_VISIBLE_RESOURCE_TAGS),
//     hasAnyTags: orderedTags.length > 0,
//   };
// }

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
  const { list, query, onClick, isResource } = props;
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
                key={`${buildBoxSearchKey(original)}`}
                resource={original as HighlightedDashboardResource}
              />
            ))}
        {filteredList.length > currentSizeList && <Button onClick={handleSeeMore}> see more...</Button>}
      </Stack>
    </Box>
  );
}