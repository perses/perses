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

import { isProjectMetadata, Resource } from '@perses-dev/core';
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { KVSearch, KVSearchConfiguration, KVSearchResult } from '@nexucis/kvsearch';
import { Box, Button, Chip, Theme, Typography } from '@mui/material';
import Archive from 'mdi-material-ui/Archive';
import MiddleAlertIcon from 'mdi-material-ui/StarFourPointsOutline';
import { Link as RouterLink } from 'react-router-dom';
import { ProjectRoute } from '../../../model/route';

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

type SearchItem = Resource & { highlight?: boolean };
type SearchMatch = NonNullable<KVSearchResult<SearchItem>['matched']>[number];

function buildBoxSearchKey(resource: Resource): string {
  return isProjectMetadata(resource.metadata)
    ? `${resource.kind}-${resource.metadata.project}-${resource.metadata.name}`
    : `${resource.kind}-${resource.metadata.name}`;
}

function buildRouting(resource: Resource): string {
  return isProjectMetadata(resource.metadata)
    ? `${ProjectRoute}/${resource.metadata.project}/${resource.kind.toLowerCase()}s/${resource.metadata.name}`
    : `/${resource.kind.toLowerCase()}s/${resource.metadata.name}`;
}

function getHighlightBackgroundColor(theme: Theme, isHighlighted: boolean): string {
  if (!isHighlighted) {
    return 'inherit';
  }
  return theme.palette.mode === 'dark' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 223, 186, 0.3)';
}

function getHighlightBorderColor(theme: Theme, isHighlighted: boolean): string {
  if (!isHighlighted) {
    return 'inherit';
  }
  return theme.palette.mode === 'dark' ? 'orange' : 'darkorange';
}

function getHighlightTextColor(theme: Theme, isHighlighted: boolean): string {
  return isHighlighted && theme.palette.mode === 'dark' ? theme.palette.warning.light : 'inherit';
}

function isTagMatch(match: SearchMatch): match is SearchMatch & { value: string } {
  return (
    match.path.length === 2 &&
    match.path[0] === 'metadata' &&
    match.path[1] === 'tags' &&
    typeof match.value === 'string'
  );
}

function getMatchingTagValues(matched: KVSearchResult<SearchItem>['matched'], enabled: boolean): string[] {
  if (!enabled) {
    return [];
  }

  return Array.from(new Set((matched ?? []).filter(isTagMatch).map((match) => match.value)));
}

function getTagDisplayValues(
  tags: string[] | undefined,
  matchingTagValues: string[]
): {
  normalizedMatchingTags: Set<string>;
  visibleTags: string[];
  hiddenTagsCount: number;
  hasAnyTags: boolean;
} {
  const normalizedMatchingTags = new Set(matchingTagValues.map((tag) => tag.toLowerCase()));
  const uniqueTags = Array.from(new Set(tags ?? []));
  const matchedTags = uniqueTags.filter((tag) => normalizedMatchingTags.has(tag.toLowerCase()));
  const unmatchedTags = uniqueTags.filter((tag) => !normalizedMatchingTags.has(tag.toLowerCase()));
  const orderedTags = [...matchedTags, ...unmatchedTags];

  return {
    normalizedMatchingTags,
    visibleTags: orderedTags.slice(0, MAX_VISIBLE_RESOURCE_TAGS),
    hiddenTagsCount: Math.max(0, orderedTags.length - MAX_VISIBLE_RESOURCE_TAGS),
    hasAnyTags: orderedTags.length > 0,
  };
}

export interface SearchListProps {
  list: SearchItem[];
  query: string;
  onClick: () => void;
  icon: typeof Archive;
  chip?: boolean;
  buildRouting?: (resource: Resource) => string;
  isResource?: (isAvailable: boolean) => void;
}

export function SearchList(props: SearchListProps): ReactElement | null {
  const { list, query, onClick, icon: Icon, chip, buildRouting: customBuildRouting, isResource } = props;

  const [currentSizeList, setCurrentSizeList] = useState<number>(SIZE_LIST);
  const kvSearch = useRef(new KVSearch<Resource>(kvSearchConfig)).current;

  const filteredList: Array<KVSearchResult<SearchItem>> = useMemo(() => {
    if (!query && list?.[0]?.kind === 'Dashboard') {
      return list.map((item, idx) => ({
        original: item,
        rendered: item,
        score: 0,
        index: idx,
        matched: [],
      }));
    }
    return kvSearch.filter(query, list);
  }, [kvSearch, list, query]);

  useEffect(() => {
    // Reset the size of the filtered list when query or the actual list change.
    // Otherwise, we would keep the old size that can have been changed using the button to see more data.
    setCurrentSizeList(SIZE_LIST);
  }, [query, list]);

  useEffect(() => {
    isResource?.(!!filteredList.length);
  }, [filteredList.length, isResource]);

  if (!filteredList.length) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0, height: 'auto', minHeight: 0, minWidth: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginTop: 0.5,
          marginBottom: 1,
          marginLeft: 0.5,
        }}
      >
        <Icon sx={{ marginRight: 0.5 }} fontSize="medium" />
        <Typography variant="h3">{filteredList[0]?.original.kind}s</Typography>
      </Box>
      {filteredList.slice(0, currentSizeList).map((search) => {
        const isHighlighted = Boolean(search.original.highlight);
        const isDashboard = search.original.kind === 'Dashboard';
        const matchingTagValues = getMatchingTagValues(search.matched, Boolean(query));
        const { normalizedMatchingTags, visibleTags, hiddenTagsCount, hasAnyTags } = getTagDisplayValues(
          search.original.metadata.tags,
          matchingTagValues
        );

        const projectName = isProjectMetadata(search.original.metadata) ? search.original.metadata.project : undefined;
        const showInlineProjectName = Boolean(projectName && isDashboard);
        const showProjectChip = Boolean(projectName && chip && !isDashboard);
        const showResourceTagChips = hasAnyTags;

        return (
          <Button
            variant="outlined"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 1,
              marginLeft: 1,
              marginRight: 1,
              backgroundColor: (theme) => getHighlightBackgroundColor(theme, isHighlighted),
              borderColor: (theme) => getHighlightBorderColor(theme, isHighlighted),
              fontWeight: isHighlighted ? 'bold' : 'normal',
              color: (theme) => getHighlightTextColor(theme, isHighlighted),
            }}
            component={RouterLink}
            onClick={onClick}
            to={`${customBuildRouting ? customBuildRouting(search.original) : buildRouting(search.original)}`}
            key={`${buildBoxSearchKey(search.original)}`}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: 0.5, flex: 1 }}>
              {isHighlighted && <MiddleAlertIcon sx={{ marginRight: 0.5 }} />}
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: 0.75 }}>
                <Box
                  component="span"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  dangerouslySetInnerHTML={{
                    __html: kvSearch.render(search.original, search.matched, {
                      pre: '<strong style="color:darkorange">',
                      post: '</strong>',
                      escapeHTML: true,
                    }).metadata.name,
                  }}
                />
                {showInlineProjectName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    <Archive sx={{ fontSize: 12, color: 'text.disabled', flexShrink: 0 }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {projectName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            {(showResourceTagChips || showProjectChip) && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, flexWrap: 'wrap' }}
              >
                {visibleTags.map((tag) => (
                  <Chip
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={normalizedMatchingTags.has(tag.toLowerCase()) ? matchedTagChipSx : undefined}
                    key={`${buildBoxSearchKey(search.original)}-${tag}`}
                  />
                ))}
                {hiddenTagsCount > 0 && <Chip label={`+${hiddenTagsCount}`} size="small" variant="outlined" />}
                {showProjectChip && <Chip label={projectName} size="small" variant="outlined" />}
              </Box>
            )}
          </Button>
        );
      })}
      {filteredList.length > currentSizeList && (
        <Button onClick={() => setCurrentSizeList(currentSizeList + 10)}> see more...</Button>
      )}
    </Box>
  );
}
