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
import React, { useMemo } from 'react';
import { DashboardResource, ProjectResource } from '@perses-dev/core';
import { KVSearch, KVSearchConfiguration, KVSearchResult } from '@nexucis/kvsearch';
import { Link as RouterLink } from 'react-router-dom';
import { useIsMobileSize } from '../../utils/browser-size';
import { isAppleDevice } from '../../utils/os';
import { useDashboardList } from '../../model/dashboard-client';
import { useProjectList } from '../../model/project-client';

const kvSearchConfig = {
  indexedKeys: [['metadata', 'name']],
  shouldSort: true,
  includeMatches: true,
} as KVSearchConfiguration;

const sizeList = 10;

function shortcutCTRL() {
  return isAppleDevice() ? '⌘' : 'ctrl';
}

function SearchProjectList(props: { list: ProjectResource[]; query: string; onClick: () => void }) {
  const kvSearch = useMemo(() => new KVSearch<ProjectResource>(kvSearchConfig), []);
  const filteredList: Array<KVSearchResult<ProjectResource>> = useMemo(() => {
    if (props.query) {
      return kvSearch.filter(props.query, props.list);
    } else {
      return [];
    }
  }, [kvSearch, props.list, props.query]);
  return filteredList.length === 0 ? (
    <></>
  ) : (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginBottom: 1,
          marginLeft: 0.5,
        }}
      >
        <Archive sx={{ marginRight: 0.5 }} fontSize="medium" />
        <Typography variant="h3">Projects</Typography>
      </Box>

      {filteredList.slice(0, sizeList).map((search) => (
        <Button
          variant="outlined"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 1,
            marginLeft: 1,
            marginRight: 1,
          }}
          component={RouterLink}
          onClick={props.onClick}
          to={`/projects/${search.original.metadata.name}`}
          key={`project-${search.original.metadata.name}`}
        >
          <Box sx={{ display: 'flex' }} flexDirection="row" alignItems="center">
            <span
              dangerouslySetInnerHTML={{
                __html: kvSearch.render(search.original, search.matched, {
                  pre: '<strong style="color:darkorange">',
                  post: '</strong>',
                  escapeHTML: true,
                }).metadata.name,
              }}
            />
          </Box>
        </Button>
      ))}
    </Box>
  );
}

function SearchDashboardList(props: { list: DashboardResource[]; query: string; onClick: () => void }) {
  const kvSearch = useMemo(() => new KVSearch<DashboardResource>(kvSearchConfig), []);

  const filteredList: Array<KVSearchResult<DashboardResource>> = useMemo(() => {
    if (props.query) {
      return kvSearch.filter(props.query, props.list);
    } else {
      return [];
    }
  }, [kvSearch, props.list, props.query]);

  return filteredList.length === 0 ? (
    <></>
  ) : (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginBottom: 1,
          marginLeft: 0.5,
        }}
      >
        <ViewDashboardIcon sx={{ marginRight: 0.5 }} fontSize="medium" />
        <Typography variant="h3">Dashboards</Typography>
      </Box>
      {filteredList.slice(0, sizeList).map((search) => (
        <Button
          variant="outlined"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 1,
            marginLeft: 1,
            marginRight: 1,
          }}
          component={RouterLink}
          onClick={props.onClick}
          to={`/projects/${search.original.metadata.project}/dashboards/${search.original.metadata.name}`}
          key={`dashboard-${search.original.metadata.project}-${search.original.metadata.name}`}
        >
          <Box sx={{ display: 'flex' }} flexDirection="row" alignItems="center">
            <span
              dangerouslySetInnerHTML={{
                __html: kvSearch.render(search.original, search.matched, {
                  pre: '<strong style="color:darkorange">',
                  post: '</strong>',
                  escapeHTML: true,
                }).metadata.name,
              }}
            />
          </Box>
          <Chip label={`${search.original.metadata.project}`} size="small" variant="outlined" />
        </Button>
      ))}
    </Box>
  );
}

export function SearchBar() {
  const isMobileSize = useIsMobileSize();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const dashboardQueryResult = useDashboardList(undefined, true);
  const projectsQueryResult = useProjectList();
  return (
    <Paper sx={{ flexGrow: 2, maxWidth: isMobileSize ? '50%' : '30%' }}>
      <Button size="small" fullWidth sx={{ display: 'flex', justifyContent: 'space-between' }} onClick={handleOpen}>
        <Box sx={{ display: 'flex' }} flexDirection="row" alignItems="center">
          <Magnify sx={{ marginRight: 0.5 }} fontSize="medium" />
          <Typography>Search ...</Typography>
        </Box>
        <Chip label={`${shortcutCTRL()}+k`} size="small" />
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <Paper
          elevation={0}
          sx={{
            height: '70%',
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            position: 'fixed',
            overflowY: 'scroll',
          }}
          variant="outlined"
        >
          <TextField
            size="medium"
            variant="outlined"
            placeholder="What are you looking for ?"
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
                  <Chip label="esp" size="small" onClick={handleClose} />
                </InputAdornment>
              ),
            }}
          />
          <SearchDashboardList list={dashboardQueryResult.data ?? []} query={query} onClick={handleClose} />
          <SearchProjectList list={projectsQueryResult.data ?? []} query={query} onClick={handleClose} />
        </Paper>
      </Modal>
    </Paper>
  );
}
