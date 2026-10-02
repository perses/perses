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
import ProjectIcon from 'mdi-material-ui/Archive';
import CheckIcon from 'mdi-material-ui/Check';
import DeleteIcon from 'mdi-material-ui/CloseCircle';
import DatabaseIcon from 'mdi-material-ui/Database';
import FilterIcon from 'mdi-material-ui/Filter';
import DashboardIcon from 'mdi-material-ui/ViewDashboard';
import type { Dispatch, ReactElement, SetStateAction } from 'react';

import { ALL_RESOURCE_TYPES, ALL_RESOURCE_TYPES_TITLES } from './model';
import type { ResourceType } from './model';

const STATIC_SX = {
  mainWrapper: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    pb: 1,
    pt: 1,
    pr: 0.25,
    pl: 0.25,
  },
  activeFilter: {
    height: 34,
    borderRadius: '18px',
    cursor: 'pointer',
    color: 'primary.main',
    borderColor: 'primary.main',
    '& .MuiChip-icon': {
      color: 'inherit',
    },
  },
  deactivateFilter: {
    height: 34,
    borderRadius: '18px',
    cursor: 'pointer',
    color: 'text.secondary',
    borderColor: 'divider',
    '& .MuiChip-icon': {
      color: 'inherit',
    },
    '& .Mui-deleteIcon': {
      color: 'inherit',
    },
  },
  labelWrapper: {
    flexShrink: 0,
    minHeight: 34,
  },
  label: { whiteSpace: 'nowrap' },
  filtersWrapper: {
    flex: 1,
    minWidth: 0,
  },
} satisfies Record<string, SxProps<Theme>>;

const RESOURCE_ICON: Record<ResourceType, ReactElement> = {
  datasources: <DatabaseIcon fontSize="small" />,
  globalDatasources: <DatabaseIcon fontSize="small" />,
  dashboards: <DashboardIcon fontSize="small" />,
  projects: <ProjectIcon fontSize="small" />,
};

export interface SearchBarFiltersProps {
  filters: Set<ResourceType>;
  setFilters: Dispatch<SetStateAction<Set<ResourceType>>>;
}

export const SearchBarFilters = (props: SearchBarFiltersProps): ReactElement => {
  const { filters, setFilters } = props;

  const filtersStatus: Array<{ filter: ResourceType; active: boolean }> = ALL_RESOURCE_TYPES.map((filter) => {
    return {
      filter,
      active: filters.has(filter),
    };
  });

  return (
    <Stack className="searchFilters" direction="row" alignItems="center" spacing={1} sx={STATIC_SX.mainWrapper}>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={STATIC_SX.labelWrapper}>
        <FilterIcon fontSize="small" />
        <Typography variant="body2" color="text.secondary" sx={STATIC_SX.label}>
          Searching in:
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={STATIC_SX.filtersWrapper} flexWrap="wrap" gap={1}>
        {filtersStatus.sort().map(({ filter, active }) => (
          <Chip
            key={filter}
            icon={RESOURCE_ICON[filter]}
            // oxlint-disable-next-line react-perf/jsx-no-new-function-as-prop
            onClick={(): void => {
              const included = filters.has(filter);
              if (included) {
                if (filters.size === 1) {
                  return;
                }
                setFilters((prev) => {
                  return new Set(Array.from(prev).filter((f) => f !== filter));
                });
                return;
              }
              setFilters((prev) => new Set([...prev, filter]));
            }}
            label={
              // oxlint-disable-next-line react-perf/jsx-no-jsx-as-prop
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>{ALL_RESOURCE_TYPES_TITLES[filter]}</span>
                {active ? <CheckIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
              </Stack>
            }
            variant="outlined"
            sx={active ? STATIC_SX.activeFilter : STATIC_SX.deactivateFilter}
          />
        ))}
      </Stack>
    </Stack>
  );
};
