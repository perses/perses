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
import { Box, Button, Chip, Typography } from '@mui/material';
import Archive from 'mdi-material-ui/Archive';
import MiddleAlertIcon from 'mdi-material-ui/StarFourPointsOutline';
import { Link as RouterLink } from 'react-router-dom';
import { ProjectRoute } from '../../../model/route';

const kvSearchConfig: KVSearchConfiguration = {
  indexedKeys: [['metadata', 'name']],
  shouldSort: true,
  includeMatches: true,
  shouldRender: false,
  excludedChars: [' '],
};

const SIZE_LIST = 10;

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

export interface SearchListProps {
  list: Array<Resource & { highlight?: boolean }>;
  query: string;
  onClick: () => void;
  icon: typeof Archive;
  chip?: boolean;
  buildRouting?: (resource: Resource) => string;
  isResource?: (isAvailable: boolean) => void;
}

export function SearchList(props: SearchListProps): ReactElement | null {
  const [currentSizeList, setCurrentSizeList] = useState<number>(SIZE_LIST);
  const kvSearch = useRef(new KVSearch<Resource>(kvSearchConfig)).current;
  const filteredList: Array<KVSearchResult<Resource & { highlight?: boolean }>> = useMemo(() => {
    if (!props.query && props.list?.[0]?.kind === 'Dashboard') {
      return props.list.map((item, idx) => ({
        original: item,
        rendered: item,
        score: 0,
        index: idx,
        matched: [],
      }));
    }
    return kvSearch.filter(props.query, props.list);
  }, [kvSearch, props.list, props.query]);

  useEffect(() => {
    // Reset the size of the filtered list when query or the actual list change.
    // Otherwise, we would keep the old size that can have been changed using the button to see more data.
    setCurrentSizeList(SIZE_LIST);
  }, [props.query, props.list]);

  useEffect(() => {
    props.isResource?.(!!filteredList.length);
  }, [filteredList.length, props]);

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
        <props.icon sx={{ marginRight: 0.5 }} fontSize="medium" />
        <Typography variant="h3">{filteredList[0]?.original.kind}s</Typography>
      </Box>

      {filteredList.slice(0, currentSizeList).map((search) => (
        <Button
          variant="outlined"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 1,
            marginLeft: 1,
            marginRight: 1,
            backgroundColor: (theme) =>
              search.original.highlight
                ? theme.palette.mode === 'dark'
                  ? 'rgba(255, 165, 0, 0.2)'
                  : 'rgba(255, 223, 186, 0.3)'
                : 'inherit',
            borderColor: (theme) =>
              search.original.highlight ? (theme.palette.mode === 'dark' ? 'orange' : 'darkorange') : 'inherit',
            fontWeight: search.original.highlight ? 'bold' : 'normal',
            color: (theme) =>
              search.original.highlight
                ? theme.palette.mode === 'dark'
                  ? theme.palette.warning.light
                  : 'inherit'
                : 'inherit',
          }}
          component={RouterLink}
          onClick={props.onClick}
          to={`${props.buildRouting ? props.buildRouting(search.original) : buildRouting(search.original)}`}
          key={`${buildBoxSearchKey(search.original)}`}
        >
          <Box sx={{ display: 'flex' }} flexDirection="row" alignItems="center">
            {search.original.highlight && <MiddleAlertIcon sx={{ marginRight: 0.5 }} />}
            <span
              dangerouslySetInnerHTML={{
                __html: kvSearch.render(search.original, search.matched, {
                  pre: '<strong style="color:darkorange">',
                  post: '</strong>',
                  escapeHTML: true,
                }).metadata.name,
              }}
            />
          </Box>
          {isProjectMetadata(search.original.metadata) && props.chip && (
            <Chip label={`${search.original.metadata.project}`} size="small" variant="outlined" />
          )}
        </Button>
      ))}
      {filteredList.length > currentSizeList && (
        <Button onClick={() => setCurrentSizeList(currentSizeList + 10)}> see more...</Button>
      )}
    </Box>
  );
}
