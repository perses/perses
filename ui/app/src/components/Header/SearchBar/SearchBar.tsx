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

import { Box, Button, Chip, InputAdornment, Modal, Paper, TextField, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import type { Resource, StatusError } from '@perses-dev/client';
import { isProjectMetadata } from '@perses-dev/client';
import { formatForDisplay, OPEN_SEARCH_EVENT } from '@perses-dev/dashboards';
import Archive from 'mdi-material-ui/Archive';
import Close from 'mdi-material-ui/Close';
import DatabaseIcon from 'mdi-material-ui/Database';
import EmoticonSadOutline from 'mdi-material-ui/EmoticonSadOutline';
import Magnify from 'mdi-material-ui/Magnify';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import type { MouseEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  GlobalProject,
  useCanReadAnyProject,
  useHasPermission,
  useHasPermissionInAnyProject,
  usePermissionsQueryStatus,
} from '../../../context/Authorization';
import { useDashboardList, useImportantDashboardList } from '../../../model/dashboard-client';
import { useDatasourceList } from '../../../model/datasource-client';
import { useGlobalDatasourceList } from '../../../model/global-datasource-client';
import { useProjectList } from '../../../model/project-client';
import { AdminRoute, ProjectRoute } from '../../../model/route';
import { useIsMobileSize } from '../../../utils/browser-size';
import { SearchErrorAlert } from './SearchErrorAlert';
import { SearchList } from './SearchList';

function shortcutDisplay(): string {
  return formatForDisplay('Mod+K');
}

type ResourceType = 'dashboards' | 'projects' | 'globalDatasources' | 'datasources';

interface ResourceListProps {
  query: string;
  onClick: () => void;
  isResources?: (type: ResourceType, available: boolean) => void;
}

const EMPTY_RESOURCE_LIST: Resource[] = [];

function SearchProjectList(
  props: ResourceListProps & { list: Resource[]; error: StatusError | null },
): ReactElement | null {
  const { query, onClick, isResources, list, error } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('projects', isAvailable),
    [isResources],
  );

  if (error) {
    return <SearchErrorAlert title="Failed to load projects" error={error} />;
  }

  return <SearchList list={list} query={query} onClick={onClick} icon={Archive} isResource={handleIsResource} />;
}

function SearchGlobalDatasource(
  props: ResourceListProps & { list: Resource[]; error: StatusError | null },
): ReactElement | null {
  const { query, onClick, isResources, list, error } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('globalDatasources', isAvailable),
    [isResources],
  );

  if (error) {
    return <SearchErrorAlert title="Failed to load global datasources" error={error} />;
  }

  return (
    <SearchList
      list={list}
      query={query}
      onClick={onClick}
      icon={DatabaseIcon}
      buildRouting={() => `${AdminRoute}/datasources`}
      isResource={handleIsResource}
    />
  );
}

function SearchDashboardList(
  props: ResourceListProps & {
    list: Array<Resource & { highlight: boolean }>;
    error: StatusError | null;
    isLoading: boolean;
  },
): ReactElement | null {
  const { query, isResources, onClick, list, error, isLoading } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('dashboards', isAvailable),
    [isResources],
  );

  if (error) {
    return <SearchErrorAlert title="Failed to load dashboards" error={error} />;
  }

  return isLoading ? null : (
    <SearchList
      list={list}
      query={query}
      onClick={onClick}
      icon={ViewDashboardIcon}
      chip={true}
      isResource={handleIsResource}
    />
  );
}

function SearchDatasourceList(
  props: ResourceListProps & { list: Resource[]; error: StatusError | null },
): ReactElement | null {
  const { isResources, onClick, query, list, error } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('datasources', isAvailable),
    [isResources],
  );

  if (error) {
    return <SearchErrorAlert title="Failed to load datasources" error={error} />;
  }

  return (
    <SearchList
      list={list}
      query={query}
      onClick={onClick}
      icon={DatabaseIcon}
      chip={true}
      buildRouting={(resource) =>
        `${ProjectRoute}/${isProjectMetadata(resource.metadata) ? resource.metadata.project : ''}/datasources`
      }
      isResource={handleIsResource}
    />
  );
}

function useHandleShortCut(handleOpen: () => void): void {
  useEffect(() => {
    const handler = (): void => {
      handleOpen();
    };
    window.addEventListener(OPEN_SEARCH_EVENT, handler);
    return (): void => {
      window.removeEventListener(OPEN_SEARCH_EVENT, handler);
    };
  }, [handleOpen]);
}

export function SearchBar(): ReactElement {
  const isMobileSize = useIsMobileSize();
  const { isLoading: isPermissionsLoading, error: permissionsError } = usePermissionsQueryStatus();
  const canReadDashboards = useHasPermissionInAnyProject('read', 'Dashboard');
  const canReadProjects = useCanReadAnyProject();
  const canReadDatasources = useHasPermissionInAnyProject('read', 'Datasource');
  const canReadGlobalDatasources = useHasPermission('read', GlobalProject, 'GlobalDatasource');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const canFetchSearchLists = open && !isPermissionsLoading && !permissionsError;
  const fetchDashboards = canFetchSearchLists && canReadDashboards;
  const fetchProjects = canFetchSearchLists && canReadProjects;
  const fetchDatasources = canFetchSearchLists && canReadDatasources;
  const fetchGlobalDatasources = canFetchSearchLists && canReadGlobalDatasources;
  const [hasResource, setHasResource] = useState<Record<ResourceType, boolean>>({
    dashboards: false,
    projects: false,
    globalDatasources: false,
    datasources: false,
  });

  const {
    data: dashboardList,
    isLoading: dashboardListLoading,
    error: dashboardListError,
  } = useDashboardList({
    metadataOnly: true,
    refetchOnMount: false,
    enabled: fetchDashboards,
  });
  const {
    data: importantDashboards,
    isLoading: importantDashboardsLoading,
    error: importantDashboardsError,
  } = useImportantDashboardList(undefined, { enabled: fetchDashboards });
  const { data: projectList, error: projectListError } = useProjectList({
    refetchOnMount: false,
    enabled: fetchProjects,
  });
  const { data: globalDatasourceList, error: globalDatasourceListError } = useGlobalDatasourceList({
    refetchOnMount: false,
    enabled: fetchGlobalDatasources,
  });
  const { data: datasourceList, error: datasourceListError } = useDatasourceList({
    refetchOnMount: false,
    enabled: fetchDatasources,
  });

  const dashboardSearchList: Array<Resource & { highlight: boolean }> = useMemo(() => {
    if (query.length && dashboardList) {
      const importantDashboardKeys = new Set(
        (importantDashboards ?? []).map(
          (importantDashboard) => `${importantDashboard.metadata.project}/${importantDashboard.metadata.name}`,
        ),
      );
      return dashboardList.map((d) => {
        const highlight = importantDashboardKeys.has(`${d.metadata.project}/${d.metadata.name}`);
        return { ...d, highlight };
      });
    }
    return (importantDashboards ?? []).map((imp) => ({ ...imp, highlight: true }));
  }, [importantDashboards, dashboardList, query]);

  const dashboardError = dashboardListError ?? importantDashboardsError ?? null;
  const handleIsResourceAvailable = useCallback((type: ResourceType, available: boolean): void => {
    setHasResource((prev) => (prev[type] === available ? prev : { ...prev, [type]: available }));
  }, []);

  const hasAnyResource =
    (fetchDashboards && hasResource.dashboards) ||
    (fetchProjects && hasResource.projects) ||
    (fetchGlobalDatasources && hasResource.globalDatasources) ||
    (fetchDatasources && hasResource.datasources);
  const hasAnyLoadError = Boolean(
    (fetchDashboards && dashboardError) ||
    (fetchProjects && projectListError) ||
    (fetchGlobalDatasources && globalDatasourceListError) ||
    (fetchDatasources && datasourceListError),
  );
  const handleSearchInputRef = useCallback((inputElement: HTMLInputElement | null): void => {
    inputElement?.focus();
  }, []);
  const handleOpenMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
  }, []);
  const handleOpen = useCallback((): void => setOpen(true), []);
  const handleClose = useCallback((): void => setOpen(false), []);
  useHandleShortCut(handleOpen);

  return (
    <Paper sx={{ width: '100%', flexShrink: 1 }}>
      <Button
        size="small"
        fullWidth
        sx={{ display: 'flex', justifyContent: 'space-between' }}
        onMouseDown={handleOpenMouseDown}
        onClick={handleOpen}
      >
        <Box sx={{ display: 'flex' }} flexDirection="row" alignItems="center">
          <Magnify sx={{ marginRight: 0.5 }} fontSize="medium" />
          <Typography>Search...</Typography>
        </Box>
        {!isMobileSize && <Chip label={shortcutDisplay()} size="small" />}
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        style={{ display: 'flex', justifyContent: 'center' }}
        disableAutoFocus={true}
        sx={{ display: 'flex', alignItems: 'flex-start', overflowY: 'auto' }}
      >
        <Paper
          elevation={0}
          sx={{
            maxHeight: '70vh',
            width: isMobileSize ? '95%' : '55%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            overflowY: 'auto',
            height: 'auto',
          }}
          variant="outlined"
        >
          <TextField
            size="medium"
            /* oxlint-disable-next-line jsx-a11y/no-autofocus */
            autoFocus={true}
            inputRef={handleSearchInputRef}
            variant="outlined"
            placeholder="What are you looking for?"
            fullWidth
            sx={{ justifyContent: 'flex-start', marginBottom: 1 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Magnify sx={{ marginRight: 0.5 }} fontSize="medium" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {query && (
                    <IconButton size="small" onClick={() => setQuery('')}>
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                  <Chip label="esc" size="small" onClick={handleClose} />
                </InputAdornment>
              ),
            }}
          />
          {permissionsError && <SearchErrorAlert title="Failed to load permissions" error={permissionsError} />}
          {query.length > 0 && !hasAnyResource && !hasAnyLoadError && !isPermissionsLoading && !permissionsError && (
            <Box sx={{ margin: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <EmoticonSadOutline fontSize="medium" />
              <Typography>No records found for {query}</Typography>
            </Box>
          )}
          {fetchDashboards && (
            <SearchDashboardList
              query={query}
              onClick={handleClose}
              isResources={handleIsResourceAvailable}
              list={dashboardSearchList}
              error={dashboardError}
              isLoading={dashboardListLoading || importantDashboardsLoading}
            />
          )}
          {fetchProjects && (
            <SearchProjectList
              query={query}
              onClick={handleClose}
              isResources={handleIsResourceAvailable}
              list={projectList ?? EMPTY_RESOURCE_LIST}
              error={projectListError ?? null}
            />
          )}
          {fetchGlobalDatasources && (
            <SearchGlobalDatasource
              query={query}
              onClick={handleClose}
              isResources={handleIsResourceAvailable}
              list={globalDatasourceList ?? EMPTY_RESOURCE_LIST}
              error={globalDatasourceListError ?? null}
            />
          )}
          {fetchDatasources && (
            <SearchDatasourceList
              query={query}
              onClick={handleClose}
              isResources={handleIsResourceAvailable}
              list={datasourceList ?? EMPTY_RESOURCE_LIST}
              error={datasourceListError ?? null}
            />
          )}
        </Paper>
      </Modal>
    </Paper>
  );
}
