// Copyright 2024 The Perses Authors
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
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { KVSearch, KVSearchConfiguration, KVSearchResult } from '@nexucis/kvsearch';
import { Box, Button, Chip, Typography } from '@mui/material';
import Archive from 'mdi-material-ui/Archive';
import { Link as RouterLink } from 'react-router-dom';
import { ProjectRoute } from '../../../model/route';

const kvSearchConfig: KVSearchConfiguration = {
  indexedKeys: [['metadata', 'name']],
  shouldSort: true,
  includeMatches: true,
  shouldRender: false,
  excludedChars: [' '],
};

const sizeList = 10;

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
  list: Resource[];
  query: string;
  onClick: () => void;
  icon: typeof Archive;
  chip?: boolean;
  buildRouting?: (resource: Resource) => string;
}

export function SearchList(props: SearchListProps): ReactElement {
  const [currentSizeList, setCurrentSizeList] = useState<number>(sizeList);
  const kvSearch = useMemo(() => new KVSearch<Resource>(kvSearchConfig), []);
  const filteredList: Array<KVSearchResult<Resource>> = useMemo(() => {
    if (props.query) {
      return kvSearch.filter(props.query, props.list);
    } else {
      return [];
    }
  }, [kvSearch, props.list, props.query]);
  useEffect(() => {
    // Reset the size of the filtered list when query or the actual list change.
    // Otherwise, we would keep the old size that can have been changed using the button to see more data.
    setCurrentSizeList(sizeList);
  }, [props.query, props.list]);

  return filteredList.length === 0 ? (
    <></>
  ) : (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
          }}
          component={RouterLink}
          onClick={props.onClick}
          to={`${props.buildRouting ? props.buildRouting(search.original) : buildRouting(search.original)}`}
          key={`${buildBoxSearchKey(search.original)}`}
        >
          <Box sx={{ display: 'flex' }} flexDirection="row" alignItems="center">
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
