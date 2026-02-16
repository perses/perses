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

import { Alert, Box, Button, Chip, InputAdornment, Modal, Paper, TextField, Typography } from '@mui/material';
import Magnify from 'mdi-material-ui/Magnify';
import EmoticonSadOutline from 'mdi-material-ui/EmoticonSadOutline';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import Archive from 'mdi-material-ui/Archive';
import DatabaseIcon from 'mdi-material-ui/Database';
import { MouseEvent, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { isProjectMetadata, Resource } from '@perses-dev/core';
import IconButton from '@mui/material/IconButton';
import Close from 'mdi-material-ui/Close';
import { useIsMobileSize } from '../../../utils/browser-size';
import { isAppleDevice } from '../../../utils/os';
import { useDashboardList, useImportantDashboardList } from '../../../model/dashboard-client';
import { useProjectList } from '../../../model/project-client';
import { AdminRoute, ProjectRoute } from '../../../model/route';
import { useDatasourceList } from '../../../model/datasource-client';
import { useGlobalDatasourceList } from '../../../model/global-datasource-client';
import { SearchList } from './SearchList';

function shortcutCTRL(): string {
  return isAppleDevice() ? '⌘' : 'ctrl';
}

type ResourceType = 'dashboards' | 'projects' | 'globalDatasources' | 'datasources';

interface ResourceListProps {
  query: string;
  onClick: () => void;
  isResources?: (type: ResourceType, available: boolean) => void;
}

function SearchProjectList(props: ResourceListProps): ReactElement | null {
  const projectsQueryResult = useProjectList({ refetchOnMount: false });
  const { query, onClick, isResources } = props;
  return (
    <SearchList
      list={projectsQueryResult.data ?? []}
      query={query}
      onClick={onClick}
      icon={Archive}
      isResource={(isAvailable) => isResources?.('projects', isAvailable)}
    />
  );
}

function SearchGlobalDatasource(props: ResourceListProps): ReactElement | null {
  const globalDatasourceQueryResult = useGlobalDatasourceList({ refetchOnMount: false });
  const { query, onClick, isResources } = props;
  return (
    <SearchList
      list={globalDatasourceQueryResult.data ?? []}
      query={query}
      onClick={onClick}
      icon={DatabaseIcon}
      buildRouting={() => `${AdminRoute}/datasources`}
      isResource={(isAvailable) => isResources?.('globalDatasources', isAvailable)}
    />
  );
}

function SearchDashboardList(props: ResourceListProps): ReactElement | null {
  const {
    data: dashboardList,
    isLoading: dashboardListLoading,
    error: dashboardListError,
  } = useDashboardList({
    metadataOnly: true,
    refetchOnMount: false,
  });
  const {
    data: importantDashboards,
    isLoading: importantDashboardsLoading,
    error: importantDashboardsError,
  } = useImportantDashboardList();

  const { query, isResources, onClick } = props;

  const list: Array<Resource & { highlight: boolean }> = useMemo(() => {
    if (query.length && dashboardList) {
      return dashboardList.map((d) => {
        const highlight = !!importantDashboards.some(
          (importantDashboard) =>
            importantDashboard.metadata.name === d.metadata.name &&
            importantDashboard.metadata.project === d.metadata.project
        );
        return { ...d, highlight };
      });
    } else {
      return importantDashboards.map((imp) => ({ ...imp, highlight: true }));
    }
  }, [importantDashboards, dashboardList, query]);

  if (dashboardListError || importantDashboardsError)
    return (
      <Box sx={{ margin: 1 }}>
        <Alert severity="error">
          <p>Failed to load dashboards! Error:</p>
          {importantDashboardsError?.message && <p>{importantDashboardsError.message}</p>}
          {dashboardListError?.message && <p>{dashboardListError.message}</p>}
        </Alert>
      </Box>
    );

  return dashboardListLoading || importantDashboardsLoading ? null : (
    <SearchList
      list={list}
      query={query}
      onClick={onClick}
      icon={ViewDashboardIcon}
      chip={true}
      isResource={(isAvailable) => isResources?.('dashboards', isAvailable)}
    />
  );
}

function SearchDatasourceList(props: ResourceListProps): ReactElement | null {
  const datasourceQueryResult = useDatasourceList({ refetchOnMount: false });
  const { isResources, onClick, query } = props;
  return (
    <SearchList
      list={datasourceQueryResult.data ?? []}
      query={query}
      onClick={onClick}
      icon={DatabaseIcon}
      chip={true}
      buildRouting={(resource) =>
        `${ProjectRoute}/${isProjectMetadata(resource.metadata) ? resource.metadata.project : ''}/datasources`
      }
      isResource={(isAvailable) => isResources?.('datasources', isAvailable)}
    />
  );
}

function useHandleShortCut(handleOpen: () => void): void {
  // handle what happens on key press
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const ctrlKey = isAppleDevice() ? event.metaKey : event.ctrlKey;
      if (ctrlKey && event.key === 'k') {
        event.preventDefault();
        handleOpen();
      }
    },
    [handleOpen]
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    // remove the event listener
    return (): void => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
}

export function SearchBar(): ReactElement {
  const isMobileSize = useIsMobileSize();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hasResource, setHasResource] = useState<Record<ResourceType, boolean>>({
    dashboards: false,
    projects: false,
    globalDatasources: false,
    datasources: false,
  });

  function handleIsResourceAvailable(type: ResourceType, available: boolean): void {
    setHasResource((prev) => (prev[type] === available ? prev : { ...prev, [type]: available }));
  }

  const hasAnyResource = useMemo(() => Object.values(hasResource).some(Boolean), [hasResource]);
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
        {!isMobileSize && <Chip label={`${shortcutCTRL()}+k`} size="small" />}
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
            /* eslint-disable-next-line jsx-a11y/no-autofocus */
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
          {query.length > 0 && !hasAnyResource && (
            <Box sx={{ margin: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <EmoticonSadOutline fontSize="medium" />
              <Typography>No records found for {query}</Typography>
            </Box>
          )}
          <SearchDashboardList query={query} onClick={handleClose} isResources={handleIsResourceAvailable} />
          <SearchProjectList query={query} onClick={handleClose} isResources={handleIsResourceAvailable} />
          <SearchGlobalDatasource query={query} onClick={handleClose} isResources={handleIsResourceAvailable} />
          <SearchDatasourceList query={query} onClick={handleClose} isResources={handleIsResourceAvailable} />
        </Paper>
      </Modal>
    </Paper>
  );
}
