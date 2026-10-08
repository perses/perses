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
// limitations under the Lice

import { Chip, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { GlobalDatasourceResource } from '@perses-dev/client';
import type { HTTPProxy } from '@perses-dev/spec';
import DatabaseIcon from 'mdi-material-ui/Database';
import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { AdminRoute } from '../../../model/route';
import type { SearchItemProps } from './model';
import { SearchRow } from './SearchRow';

export const GLOBAL_DATASOURCE_RESOURCE_TEST_IDS = {
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
  name: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
  },
  datasourceURL: {
    maxWidth: 300,
  },
} satisfies Record<string, SxProps<Theme>>;

export interface SearchGlobalDatasourceItemProps extends SearchItemProps {
  resource: GlobalDatasourceResource;
}

export const SearchGlobalDatasourceItem = (props: SearchGlobalDatasourceItemProps): ReactElement => {
  const {
    resource: {
      metadata: { name },
      spec,
      spec: {
        plugin: { kind },
      },
    },
    handleClose,
  } = props;

  const dataSourceKind = kind.replace('Datasource', '');
  const datasourceUrl = `${AdminRoute}/datasources`;
  let datasourceURL = '';

  if ('directURL' in spec.plugin) {
    datasourceURL = spec.plugin.directURL as string;
  } else if ('proxy' in spec.plugin.spec) {
    const proxy = spec.plugin.spec.proxy as HTTPProxy;
    datasourceURL = proxy.spec.url;
  }

  return (
    <SearchRow handleClose={handleClose}>
      <Stack component={RouterLink} to={datasourceUrl} color="inherit" sx={STATIC_SX.left} direction="row">
        <DatabaseIcon fontSize="small" />
        <Typography sx={STATIC_SX.name}>{spec.display?.name || name}</Typography>
      </Stack>
      <Stack sx={STATIC_SX.right} color="inherit" direction="row">
        <Chip sx={STATIC_SX.chip} label={dataSourceKind} />
        {datasourceURL && (
          <Typography
            data-testid={`${GLOBAL_DATASOURCE_RESOURCE_TEST_IDS.dsName}-${spec.display?.name || name}`}
            sx={STATIC_SX.datasourceURL}
            noWrap
          >
            {datasourceURL}
          </Typography>
        )}
      </Stack>
    </SearchRow>
  );
};
