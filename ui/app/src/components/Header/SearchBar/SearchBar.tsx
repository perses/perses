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

import { Box, Button, Chip, InputAdornment, Modal, Paper, Stack, TextField, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { formatForDisplay, OPEN_SEARCH_EVENT } from '@perses-dev/dashboards';
import Close from 'mdi-material-ui/Close';
import EmoticonSadOutline from 'mdi-material-ui/EmoticonSadOutline';
import FilterIcon from 'mdi-material-ui/Filter';
import Magnify from 'mdi-material-ui/Magnify';
import type { ChangeEvent, MouseEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useIsMobileSize } from '../../../utils/browser-size';
import { RESOURCE_TYPE_TITLES } from './model';
import type { ResourceType } from './model';
import { ResourceFilter } from './ResourceFilter';
import { ResourceIcon } from './ResourceIcon';
import { SearchDashboardList } from './SearchDashboardList';
import { SearchDatasourceList } from './SearchDatasourceList';
import { SearchGlobalDatasource } from './SearchGlobalDatasource';
import { SearchProjectList } from './SearchProjectList';

export const SEARCH_LIST_IDS: Record<ResourceType, string> = {
  dashboards: 'dashboard-search-list',
  datasources: 'data-source-search-list',
  globalDatasources: 'global-data-source-search-list',
  projects: 'project-search-list',
};

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedResources, setAppliedResource] = useState<Set<ResourceType>>(
    () => new Set<ResourceType>(['dashboards', 'datasources', 'globalDatasources', 'projects']),
  );
  const [hasResource, setHasResource] = useState<Record<ResourceType, boolean>>({
    dashboards: false,
    projects: false,
    globalDatasources: false,
    datasources: false,
  });

  const handleIsResourceAvailable = useCallback((type: ResourceType, available: boolean): void => {
    setHasResource((prev) => (prev[type] === available ? prev : { ...prev, [type]: available }));
  }, []);

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

  const inputTextSlotProps = useMemo(() => {
    return {
      input: {
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
      },
    };
  }, [handleClose, query]);

  const handleInputTextChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    return setQuery(e.target.value);
  }, []);

  const inputText = useMemo((): ReactElement => {
    return (
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
        onChange={handleInputTextChange}
        slotProps={inputTextSlotProps}
      />
    );
  }, [query, handleSearchInputRef, inputTextSlotProps, handleInputTextChange]);

  const applyResources = useCallback(
    (resourceTypes: Set<ResourceType>) => {
      setAppliedResource(resourceTypes);
    },
    [setAppliedResource],
  );

  const shortcutDisplay = formatForDisplay('Mod+K');

  const searBarItemsMap = useMemo((): Record<ResourceType, ReactElement> => {
    return {
      dashboards: (
        <SearchDashboardList
          id={SEARCH_LIST_IDS.dashboards}
          query={query}
          onClick={handleClose}
          isResources={handleIsResourceAvailable}
        />
      ),
      datasources: (
        <SearchDatasourceList
          id={SEARCH_LIST_IDS.datasources}
          query={query}
          onClick={handleClose}
          isResources={handleIsResourceAvailable}
        />
      ),
      globalDatasources: (
        <SearchGlobalDatasource
          id={SEARCH_LIST_IDS.globalDatasources}
          query={query}
          onClick={handleClose}
          isResources={handleIsResourceAvailable}
        />
      ),
      projects: (
        <SearchProjectList
          id={SEARCH_LIST_IDS.projects}
          query={query}
          onClick={handleClose}
          isResources={handleIsResourceAvailable}
        />
      ),
    };
  }, [query, handleIsResourceAvailable, handleClose]);

  const searchBarItems = useMemo((): ReactElement => {
    const sorted = Array.from(appliedResources).toSorted();
    return (
      <Stack direction="column">
        <Stack
          id="search-bar-indicator"
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            px: 2,
            py: 0.75,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <FilterIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ mr: 0.5 }} color="text.secondary">
            Searching in
          </Typography>
          {sorted.map((rt) => {
            return (
              <Chip
                id={`search-bar-indicator-${rt}`}
                key={rt}
                size="small"
                variant="outlined"
                label={RESOURCE_TYPE_TITLES[rt]}
                // oxlint-disable-next-line react-perf/jsx-no-jsx-as-prop
                icon={<ResourceIcon sx={{ ml: 0.5 }} resourceType={rt} />}
                sx={{
                  height: 24,
                  bgcolor: 'action.selected',
                  border: 0,
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            );
          })}
        </Stack>
        {sorted.map((i) => searBarItemsMap[i])}
      </Stack>
    );
  }, [appliedResources, searBarItemsMap]);

  return (
    <Paper sx={{ width: '100%', flexShrink: 1, display: 'flex', flexDirection: 'row' }}>
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
        {!isMobileSize && <Chip label={shortcutDisplay} size="small" />}
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
          {inputText}
          {query.length > 0 && !hasAnyResource && (
            <Box sx={{ margin: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <EmoticonSadOutline fontSize="medium" />
              <Typography>No records found for {query}</Typography>
            </Box>
          )}
          {searchBarItems}
        </Paper>
      </Modal>
      <ResourceFilter appliedResources={appliedResources} apply={applyResources} />
    </Paper>
  );
}
