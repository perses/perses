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

import { Chip, Link, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import StarIcon from 'mdi-material-ui/Star';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { ProjectRoute } from '../../../model/route';
import type { HighlightedDashboardResource } from './model';

const staticSX = {
  rowWrapper: { width: '100%', height: 32, pr: '12px', pl: '12px', pt: 0.5, pb: 0.5 },
  left: {
    alignItems: 'center',
    gap: 0.75,
    minWidth: 0,
  },
  right: {
    ml: 'auto',
    alignItems: 'center',
    gap: 0.5,
  },
  projectChip: {
    cursor: 'pointer',
    height: 20,
    textDecoration: 'underline',
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
  },
} satisfies Record<string, SxProps<Theme>>;

export interface SearchDashboardItemProps {
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
  } = props;

  const starIcon = useMemo((): ReactElement => {
    return highlight ? (
      <StarIcon sx={staticSX.goldStartIcon} fontSize="small" />
    ) : (
      <StarIcon sx={staticSX.grayStarIcon} fontSize="small" />
    );
  }, [highlight]);

  const dashboardHref = `${ProjectRoute}/${project}/${kind.toLowerCase()}s/${resource.metadata.name}`;
  const projectHref = `${ProjectRoute}/${project}`;

  return (
    <Stack direction="row" sx={staticSX.rowWrapper}>
      <Stack sx={staticSX.left} direction="row">
        <ViewDashboardIcon fontSize="small" />
        <Link component={RouterLink} to={`${dashboardHref}`} underline="always" color="inherit" sx={staticSX.name}>
          {name}
        </Link>
      </Stack>
      <Stack direction="row" sx={staticSX.right}>
        <Chip component={RouterLink} to={projectHref} label={project} size="small" sx={staticSX.projectChip} />
        {starIcon}
      </Stack>
    </Stack>
  );
};