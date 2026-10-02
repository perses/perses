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

import { Chip, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { isProjectMetadata } from '@perses-dev/client';
import type { DatasourceResource } from '@perses-dev/client';
import DatabaseIcon from 'mdi-material-ui/Database';
import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { ProjectRoute } from '../../../model/route';
import type { SearchItemProps } from './model';
import { SearchRow } from './SearchRow';

export const DATASOURCE_TEST_IDS = {
  dsName: 'ds-name',
};

const STATIC_SX = {
  left: {
    alignItems: 'center',
    gap: 0.75,
    minWidth: 0,
    textDecoration: 'none',
    flex: 1,
  },
  right: {
    ml: 'auto',
    alignItems: 'center',
    gap: 0.5,
  },
  chip: {
    height: 20,
    '& .MuiChip-label': {
      px: 1,
      fontSize: 12,
    },
  },
  linkChip: {
    height: 20,
    cursor: 'pointer',
    '& .MuiChip-label': {
      px: 1,
      fontSize: 12,
    },
  },
  name: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
  },
} satisfies Record<string, SxProps<Theme>>;

export interface SearchDatasourceItemProps extends SearchItemProps {
  resource: DatasourceResource;
}

export const SearchDatasourceItem = (props: SearchDatasourceItemProps): ReactElement => {
  const {
    resource,
    resource: {
      metadata: { name, project },
      spec,
      spec: {
        plugin: { kind },
      },
    },
    handleClose,
  } = props;

  const dataSourceKind = kind.replace('Datasource', '');
  const adminDatasourceUrl = `${ProjectRoute}/${isProjectMetadata(resource.metadata) ? project : ''}/datasources`;
  const projectUrl = `${ProjectRoute}/${project}`;

  return (
    <SearchRow handleClose={handleClose}>
      <Stack component={RouterLink} to={adminDatasourceUrl} color="inherit" sx={STATIC_SX.left} direction="row">
        <DatabaseIcon fontSize="small" />
        <Typography data-testid={`${DATASOURCE_TEST_IDS.dsName}-${spec.display?.name || name}`} sx={STATIC_SX.name}>
          {spec.display?.name || name}
        </Typography>
      </Stack>
      <Stack direction="row" sx={STATIC_SX.right}>
        <Chip label={dataSourceKind} size="small" sx={STATIC_SX.chip} />
        {project && projectUrl && (
          <Chip component={RouterLink} to={projectUrl} label={project} size="small" sx={STATIC_SX.linkChip} />
        )}
      </Stack>
    </SearchRow>
  );
};
