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

import { Metadata, ProjectMetadata, Resource } from '@perses-dev/core';
import React, { useMemo } from 'react';
import { KVSearch, KVSearchConfiguration, KVSearchResult } from '@nexucis/kvsearch';
import { Box, Button, Chip, Typography } from '@mui/material';
import Archive from 'mdi-material-ui/Archive';
import { Link as RouterLink } from 'react-router-dom';

const kvSearchConfig: KVSearchConfiguration = {
  indexedKeys: [['metadata', 'name']],
  shouldSort: true,
  includeMatches: true,
};

const sizeList = 10;

function isProjectMetadata(metadata: Metadata | ProjectMetadata): metadata is ProjectMetadata {
  return 'project' in metadata;
}

function buildBoxSearchKey(resource: Resource): string {
  return isProjectMetadata(resource.metadata)
    ? `${resource.kind}-${resource.metadata.project}-${resource.metadata.name}`
    : `${resource.kind}-${resource.metadata.name}`;
}

function buildRouting(resource: Resource): string {
  return isProjectMetadata(resource.metadata)
    ? `/projects/${resource.metadata.project}/${resource.kind.toLowerCase()}s/${resource.metadata.name}`
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

export function SearchList(props: SearchListProps) {
  const kvSearch = useMemo(() => new KVSearch<Resource>(kvSearchConfig), []);
  const filteredList: Array<KVSearchResult<Resource>> = useMemo(() => {
    if (props.query) {
      return kvSearch.filter(props.query, props.list);
    } else {
      return [];
    }
  }, [kvSearch, props.list, props.query]);
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
          marginBottom: 1,
          marginLeft: 0.5,
        }}
      >
        <props.icon sx={{ marginRight: 0.5 }} fontSize="medium" />
        <Typography variant="h3">{filteredList[0]?.original.kind}s</Typography>
      </Box>

      {filteredList.slice(0, sizeList).map((search) => (
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
    </Box>
  );
}
