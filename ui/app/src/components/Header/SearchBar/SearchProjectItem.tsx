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

import { Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { ProjectResource } from '@perses-dev/client';
import ArchiveIcon from 'mdi-material-ui/Archive';
import DatabaseIcon from 'mdi-material-ui/Database';
import DashboardIcon from 'mdi-material-ui/ViewDashboard';
import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { useDashboardList } from '../../../model/dashboard-client';
import { useDatasourceList } from '../../../model/datasource-client';
import { ProjectRoute } from '../../../model/route';
import type { SearchItemProps } from './model';
import { SearchRow } from './SearchRow';

export const PROJECT_DATA_TEST_IDS = { projectName: 'project-name' };
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
  name: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
  },
  counter: {
    textDecoration: 'none',
    alignItems: 'center',
    gap: 0.5,
    minWidth: 36,
  },
} satisfies Record<string, SxProps<Theme>>;

export interface SearchProjectItemProps extends SearchItemProps {
  resource: ProjectResource;
}

export const SearchProjectItem = (props: SearchProjectItemProps): ReactElement => {
  const {
    resource: {
      metadata: { name },
      spec,
    },
    handleClose,
  } = props;

  const projectURL = `${ProjectRoute}/${name}`;

  const { data: datasourceList } = useDatasourceList({ project: name, staleTime: Infinity });
  const { data: dashboardList } = useDashboardList({ project: name, staleTime: Infinity });

  return (
    <SearchRow handleClose={handleClose}>
      <Stack component={RouterLink} to={`${projectURL}`} color="inherit" sx={STATIC_SX.left} direction="row">
        <ArchiveIcon fontSize="small" />
        <Typography data-testid={`${PROJECT_DATA_TEST_IDS.projectName}-${name}`} sx={STATIC_SX.name}>
          {spec?.display?.name || name}
        </Typography>
      </Stack>
      <Stack sx={STATIC_SX.right} direction="row">
        <Stack
          component={RouterLink}
          to={`${projectURL}/dashboards`}
          color="inherit"
          sx={STATIC_SX.counter}
          direction="row"
        >
          <DashboardIcon fontSize="small" />
          {dashboardList?.length}
        </Stack>
        <Stack
          component={RouterLink}
          to={`${projectURL}/datasources`}
          color="inherit"
          sx={STATIC_SX.counter}
          direction="row"
        >
          <DatabaseIcon fontSize="small" />
          {datasourceList?.length}
        </Stack>
      </Stack>
    </SearchRow>
  );
};
