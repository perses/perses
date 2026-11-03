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

import { Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { ProjectResource } from '@perses-dev/client';
import ArchiveIcon from 'mdi-material-ui/Archive';
import DatabaseIcon from 'mdi-material-ui/Database';
import DashboardIcon from 'mdi-material-ui/ViewDashboard';
import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { ProjectRoute } from '../../../model/route';
import { HighlightedMatch } from './HighlightedMatch';
import { getDisplayNameMatch } from './model';
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
  datasourceCount: number;
  dashboardCount: number;
}

export const SearchProjectItem = (props: SearchProjectItemProps): ReactElement => {
  const {
    matchingResult,
    resource: {
      spec,
      metadata: { name },
    },
    handleClose,
    dashboardCount,
    datasourceCount,
  } = props;

  const projectURL = `${ProjectRoute}/${name}`;

  const { value, intervals } = getDisplayNameMatch(name, spec?.display?.name, matchingResult);

  return (
    <SearchRow>
      <Stack
        onClick={handleClose}
        component={RouterLink}
        to={projectURL}
        color="inherit"
        sx={STATIC_SX.left}
        direction="row"
      >
        <ArchiveIcon fontSize="small" />
        <HighlightedMatch
          value={value}
          intervals={intervals}
          dataTestId={`${PROJECT_DATA_TEST_IDS.projectName}-${name}`}
          sx={STATIC_SX.name}
        />
      </Stack>
      <Stack sx={STATIC_SX.right} direction="row">
        <Stack
          aria-label={`${dashboardCount ?? 0} dashboards in ${name}`}
          onClick={handleClose}
          component={RouterLink}
          to={`${projectURL}/dashboards`}
          color="inherit"
          sx={STATIC_SX.counter}
          direction="row"
        >
          <DashboardIcon fontSize="small" />
          {dashboardCount}
        </Stack>
        <Stack
          aria-label={`${datasourceCount ?? 0} datasources in ${name}`}
          onClick={handleClose}
          component={RouterLink}
          to={`${projectURL}/datasources`}
          color="inherit"
          sx={STATIC_SX.counter}
          direction="row"
        >
          <DatabaseIcon fontSize="small" />
          {datasourceCount}
        </Stack>
      </Stack>
    </SearchRow>
  );
};
