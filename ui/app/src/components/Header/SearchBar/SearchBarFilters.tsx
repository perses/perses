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

import { Chip, Stack, Tooltip, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import ProjectIcon from 'mdi-material-ui/Archive';
import CheckIcon from 'mdi-material-ui/Check';
import DatabaseIcon from 'mdi-material-ui/Database';
import FilterIcon from 'mdi-material-ui/Filter';
import DashboardIcon from 'mdi-material-ui/ViewDashboard';
import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { GlobalProject, useHasPermission } from '../../../context/Authorization';
import { useIsGlobalDatasourceEnabled, useIsProjectDatasourceEnabled } from '../../../context/Config';
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

export interface ResourceTypeFilter {
  type: ResourceType;
  active: boolean;
  // Explains why the resource type cannot be searched. When set, the filter cannot be activated.
  disabledReason?: string;
}

export interface ResourceTypeFilters {
  filters: ResourceTypeFilter[];
  activeTypes: Set<ResourceType>;
  toggleType: (type: ResourceType) => void;
}

/**
 * Single source of truth for the resource types searched by the search bar. It combines the types
 * selected by the user with the types that can actually be searched: a type disabled by the server
 * configuration or that the user cannot list is never active, so it is never requested.
 *
 * Only global datasources need a permission check. Projects, dashboards and datasources are
 * project-scoped: listing them across all projects never returns a 403, as the API only returns
 * the resources from the projects the user has access to (possibly an empty list).
 * Global datasources are global-scoped, so the API responds with a 403 if the user is missing
 * the global read permission.
 */
export function useResourceTypeFilters(): ResourceTypeFilters {
  const isGlobalDatasourceEnabled = useIsGlobalDatasourceEnabled();
  const isProjectDatasourceEnabled = useIsProjectDatasourceEnabled();
  const canReadGlobalDatasources = useHasPermission('read', GlobalProject, 'GlobalDatasource');
  const [selectedTypes, setSelectedTypes] = useState<Set<ResourceType>>(() => new Set(ALL_RESOURCE_TYPES));

  const filters = useMemo((): ResourceTypeFilter[] => {
    const disabledReasons: Partial<Record<ResourceType, string>> = {};
    if (!isGlobalDatasourceEnabled) {
      disabledReasons.globalDatasources = 'Global datasources are disabled in the server configuration';
    } else if (!canReadGlobalDatasources) {
      disabledReasons.globalDatasources = "You don't have permission to read global datasources";
    }
    if (!isProjectDatasourceEnabled) {
      disabledReasons.datasources = 'Project datasources are disabled in the server configuration';
    }
    return ALL_RESOURCE_TYPES.map((type) => {
      const disabledReason = disabledReasons[type];
      return { type, disabledReason, active: !disabledReason && selectedTypes.has(type) };
    });
  }, [isGlobalDatasourceEnabled, canReadGlobalDatasources, isProjectDatasourceEnabled, selectedTypes]);

  const activeTypes = useMemo(() => new Set(filters.flatMap(({ type, active }) => (active ? [type] : []))), [filters]);

  const toggleType = useCallback(
    (type: ResourceType): void => {
      // At least one resource type must remain active.
      if (activeTypes.has(type) && activeTypes.size === 1) {
        return;
      }
      setSelectedTypes((prev) => {
        const next = new Set(prev);
        if (!next.delete(type)) {
          next.add(type);
        }
        return next;
      });
    },
    [activeTypes],
  );

  return { filters, activeTypes, toggleType };
}

export interface SearchBarFiltersProps {
  filters: ResourceTypeFilter[];
  onToggle: (type: ResourceType) => void;
}

export const SearchBarFilters = (props: SearchBarFiltersProps): ReactElement => {
  const { filters, onToggle } = props;

  return (
    <Stack className="searchFilters" direction="row" alignItems="center" spacing={1} sx={STATIC_SX.mainWrapper}>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={STATIC_SX.labelWrapper}>
        <FilterIcon fontSize="small" />
        <Typography variant="body2" color="text.secondary" sx={STATIC_SX.label}>
          Searching in:
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={STATIC_SX.filtersWrapper} flexWrap="wrap" gap={1}>
        {filters.map(({ type, active, disabledReason }) => {
          const chip = (
            <Chip
              aria-pressed={active}
              key={type}
              icon={RESOURCE_ICON[type]}
              disabled={!!disabledReason}
              // oxlint-disable-next-line react-perf/jsx-no-new-function-as-prop
              onClick={(): void => onToggle(type)}
              label={
                // oxlint-disable-next-line react-perf/jsx-no-jsx-as-prop
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{ALL_RESOURCE_TYPES_TITLES[type]}</span>
                  {active && <CheckIcon fontSize="small" />}
                </Stack>
              }
              variant="outlined"
              sx={active ? STATIC_SX.activeFilter : STATIC_SX.deactivateFilter}
            />
          );
          // A disabled chip doesn't fire the mouse events the tooltip relies on, hence the wrapper.
          return disabledReason ? (
            <Tooltip key={type} title={disabledReason}>
              <span>{chip}</span>
            </Tooltip>
          ) : (
            chip
          );
        })}
      </Stack>
    </Stack>
  );
};
