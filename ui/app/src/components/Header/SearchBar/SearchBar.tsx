// Copyright 2024 The Perses Authors
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
import Magnify from 'mdi-material-ui/Magnify';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import Archive from 'mdi-material-ui/Archive';
import DatabaseIcon from 'mdi-material-ui/Database';
import React, { useCallback, useEffect, useState } from 'react';
import { isProjectMetadata } from '@perses-dev/core';
import { useIsMobileSize } from '../../../utils/browser-size';
import { isAppleDevice } from '../../../utils/os';
import { useDashboardList } from '../../../model/dashboard-client';
import { useProjectList } from '../../../model/project-client';
import { useGlobalDatasourceList } from '../../../model/admin-client';
import { AdminRoute, ProjectRoute } from '../../../model/route';
import { useDatasourceList } from '../../../model/datasource-client';
import { SearchList } from './SearchList';

function shortcutCTRL() {
  return isAppleDevice() ? '⌘' : 'ctrl';
}

interface ResourceListProps {
  query: string;
  onClick: () => void;
}

function SearchProjectList(props: ResourceListProps) {
  const projectsQueryResult = useProjectList({ refetchOnMount: false });
  return SearchList({
    list: projectsQueryResult.data ?? [],
    query: props.query,
    onClick: props.onClick,
    icon: Archive,
  });
}

function SearchGlobalDatasource(props: ResourceListProps) {
  const globalDatasourceQueryResult = useGlobalDatasourceList(false);
  return SearchList({
    list: globalDatasourceQueryResult.data ?? [],
    query: props.query,
    onClick: props.onClick,
    icon: DatabaseIcon,
    buildRouting: () => `${AdminRoute}/datasources`,
  });
}

function SearchDashboardList(props: ResourceListProps) {
  const dashboardQueryResult = useDashboardList(undefined, true, false);
  return SearchList({
    list: dashboardQueryResult.data ?? [],
    query: props.query,
    onClick: props.onClick,
    icon: ViewDashboardIcon,
    chip: true,
  });
}

function SearchDatasourceList(props: ResourceListProps) {
  const datasourceQueryResult = useDatasourceList(undefined, false);
  return SearchList({
    list: datasourceQueryResult.data ?? [],
    query: props.query,
    onClick: props.onClick,
    icon: DatabaseIcon,
    chip: true,
    buildRouting: (resource) =>
      `${ProjectRoute}/${isProjectMetadata(resource.metadata) ? resource.metadata.project : ''}/datasources`,
  });
}

function useHandleShortCut(handleOpen: () => void) {
  // handle what happens on key press
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const ctrlKey = isAppleDevice() ? event.metaKey : event.ctrlKey;
      if (ctrlKey && event.key === 'k') {
        handleOpen();
      }
    },
    [handleOpen]
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
}

export function SearchBar() {
  const isMobileSize = useIsMobileSize();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  useHandleShortCut(handleOpen);

  return (
    <Paper sx={{ flexGrow: 2, maxWidth: isMobileSize ? '50%' : '30%' }}>
      <Button size="small" fullWidth sx={{ display: 'flex', justifyContent: 'space-between' }} onClick={handleOpen}>
        <Box sx={{ display: 'flex' }} flexDirection="row" alignItems="center">
          <Magnify sx={{ marginRight: 0.5 }} fontSize="medium" />
          <Typography>Search ...</Typography>
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
      >
        <Paper
          elevation={0}
          sx={{
            height: '70%',
            width: isMobileSize ? '95%' : '55%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            overflowY: 'scroll',
            scrollbarWidth: 'none',
          }}
          variant="outlined"
        >
          <TextField
            size="medium"
            /* eslint-disable-next-line jsx-a11y/no-autofocus */
            autoFocus={open}
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
                  <Chip label="esc" size="small" onClick={handleClose} />
                </InputAdornment>
              ),
            }}
          />
          <SearchDashboardList query={query} onClick={handleClose} />
          <SearchProjectList query={query} onClick={handleClose} />
          <SearchGlobalDatasource query={query} onClick={handleClose} />
          <SearchDatasourceList query={query} onClick={handleClose} />
        </Paper>
      </Modal>
    </Paper>
  );
}
