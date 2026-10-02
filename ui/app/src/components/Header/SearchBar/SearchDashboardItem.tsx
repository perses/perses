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
import StarIcon from 'mdi-material-ui/Star';
import DashboardIcon from 'mdi-material-ui/ViewDashboard';
import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { ProjectRoute } from '../../../model/route';
import type { HighlightedDashboardResource, SearchItemProps } from './model';
import { SearchRow } from './SearchRow';

export const DASHBOARD_ITEM_DATA_TEST_IDS = {
  dashboardRowName: 'dashboard-row-name',
};

const STATIC_SX = {
  left: {
    alignItems: 'center',
    gap: 0.75,
    minWidth: 0,
    cursor: 'pointer',
    flex: 1,
    textDecoration: 'none',
  },
  right: {
    ml: 'auto',
    alignItems: 'center',
    gap: 0.5,
  },
  projectChip: {
    cursor: 'pointer',
    height: 20,
    '& .MuiChip-label': {
      px: 1,
      fontSize: 12,
    },
  },
  goldStartIcon: {
    color: '#FA6400',
  },
  grayStarIcon: {
    color: '#CCCCCC',
  },
  name: {
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
} satisfies Record<string, SxProps<Theme>>;

export interface SearchDashboardItemProps extends SearchItemProps {
  resource: HighlightedDashboardResource;
}

export const SearchDashboardItem = (props: SearchDashboardItemProps): ReactElement => {
  const {
    resource,
    resource: {
      metadata: { name, project },
      kind,
      highlight,
    },
    handleClose,
  } = props;

  const starIcon = useMemo((): ReactElement => {
    return highlight ? (
      <StarIcon sx={STATIC_SX.goldStartIcon} fontSize="small" />
    ) : (
      <StarIcon sx={STATIC_SX.grayStarIcon} fontSize="small" />
    );
  }, [highlight]);

  const dashboardURL = `${ProjectRoute}/${project}/${kind.toLowerCase()}s/${resource.metadata.name}`;
  const projectURL = `${ProjectRoute}/${project}`;
  return (
    <SearchRow handleClose={handleClose}>
      <Stack component={RouterLink} to={`${dashboardURL}`} color="inherit" sx={STATIC_SX.left} direction="row">
        <DashboardIcon fontSize="small" />
        <Typography data-testid={`${DASHBOARD_ITEM_DATA_TEST_IDS.dashboardRowName}-${name}`} sx={STATIC_SX.name}>
          {name}
        </Typography>
      </Stack>
      <Stack direction="row" sx={STATIC_SX.right}>
        <Chip component={RouterLink} to={projectURL} label={project} size="small" sx={STATIC_SX.projectChip} />
        {starIcon}
      </Stack>
    </SearchRow>
  );
};
