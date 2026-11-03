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

import { Box, Chip, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import StarIcon from 'mdi-material-ui/StarFourPoints';
import DashboardIcon from 'mdi-material-ui/ViewDashboard';
import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { ProjectRoute } from '../../../model/route';
import { HighlightedMatch } from './HighlightedMatch';
import type { HighlightedDashboardResource, SearchItemProps, TagsDisplayValue } from './model';
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
  right: { ml: 'auto', alignItems: 'center', gap: 0.5 },
  tags: { ml: 'auto', alignItems: 'center', gap: 0.5, textDecoration: 'none', cursor: 'pointer' },
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

const MATCHED_TAGS_CHIP_SX = {
  backgroundColor: (theme: Theme): string =>
    theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.18)' : 'rgba(255, 243, 205, 0.9)',
  borderColor: (theme: Theme): string =>
    theme.palette.mode === 'dark' ? theme.palette.warning.main : theme.palette.warning.dark,
  color: (theme: Theme): string =>
    theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark,
  fontWeight: 600,
  cursor: 'pointer',
};

export interface SearchDashboardItemProps extends SearchItemProps {
  resource: HighlightedDashboardResource;
  tagsDisplayValue: TagsDisplayValue;
}

export const SearchDashboardItem = (props: SearchDashboardItemProps): ReactElement => {
  const {
    resource,
    tagsDisplayValue: { hasAnyTags, hiddenTagsCount, normalizedMatchingTags, visibleTags },
    matchingResult,
    resource: {
      metadata: { name, project },
      kind,
      highlight,
    },
    handleClose,
  } = props;

  const dashboardURL = `${ProjectRoute}/${project}/${kind.toLowerCase()}s/${resource.metadata.name}`;
  const projectURL = `${ProjectRoute}/${project}`;

  const starIcon = useMemo((): ReactElement => {
    return highlight ? (
      <StarIcon titleAccess="Important dashboard" sx={STATIC_SX.goldStartIcon} fontSize="small" />
    ) : (
      <StarIcon titleAccess="Not an important dashboard" sx={STATIC_SX.grayStarIcon} fontSize="small" />
    );
  }, [highlight]);

  const match = matchingResult?.find((mr) => mr.path.join('.') === 'metadata.name');

  return (
    <SearchRow>
      <Stack
        component={RouterLink}
        to={dashboardURL}
        color="inherit"
        sx={STATIC_SX.left}
        onClick={handleClose}
        direction="row"
      >
        <DashboardIcon fontSize="small" />
        <HighlightedMatch
          value={name}
          intervals={match?.intervals ?? []}
          sx={STATIC_SX.name}
          dataTestId={`${DASHBOARD_ITEM_DATA_TEST_IDS.dashboardRowName}-${name}`}
        />
      </Stack>
      <Stack direction="row" sx={STATIC_SX.right}>
        {hasAnyTags && (
          <Stack onClick={handleClose} direction="row" sx={STATIC_SX.tags} component={RouterLink} to={dashboardURL}>
            {visibleTags.map((tag) => (
              <Chip
                label={tag}
                size="small"
                variant="outlined"
                sx={normalizedMatchingTags.has(tag.toLowerCase()) ? MATCHED_TAGS_CHIP_SX : undefined}
                key={`${kind}-${project}-${name}-${tag}`}
              />
            ))}
            {hiddenTagsCount > 0 && <Chip label={`+${hiddenTagsCount}`} size="small" variant="outlined" />}
          </Stack>
        )}
        <Chip
          onClick={handleClose}
          component={RouterLink}
          to={projectURL}
          label={project}
          size="small"
          sx={STATIC_SX.projectChip}
        />
        <Box onClick={handleClose} component={RouterLink} to={dashboardURL}>
          {starIcon}
        </Box>
      </Stack>
    </SearchRow>
  );
};
