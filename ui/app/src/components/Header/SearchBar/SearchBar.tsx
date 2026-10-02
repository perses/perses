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
import type { SxProps, Theme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { formatForDisplay, OPEN_SEARCH_EVENT } from '@perses-dev/dashboards';
import Close from 'mdi-material-ui/Close';
import EmoticonSadOutline from 'mdi-material-ui/EmoticonSadOutline';
import Magnify from 'mdi-material-ui/Magnify';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent, ReactElement } from 'react';

import { useIsMobileSize } from '../../../utils/browser-size';
import { ALL_RESOURCE_TYPES } from './model';
import type { ResourceType } from './model';
import { SearchBarFilters } from './SearchBarFilters';
import { SearchDashboardList } from './SearchDashboardList';
import { SearchDatasourceList } from './SearchDatasourceList';
import { SearchGlobalDatasource } from './SearchGlobalDatasource';
import { SearchProjectList } from './SearchProjectList';

const SEARCH_PLACE_HOLDER = 'Search dashboards, projects, datasources...';

export const SEARCH_BAR_DATA_TEST_ID = {
  searchButton: 'search-button',
  searchTextfield: 'search-text-field',
  noRecordContainer: 'no-record-container',
};

export const STATIC_SX = {
  mainWrapper: { width: '100%', flexShrink: 1 },
  mainButton: { display: 'flex', justifyContent: 'space-between' },
  magnifyWrapper: { display: 'flex' },
  magnify: { marginRight: 0.5 },
  modal: {
    display: 'flex',
    alignItems: 'flex-start',
    overflowY: 'auto',
    justifyContent: 'center',
  },
  textField: {
    justifyContent: 'flex-start',
    '& .MuiOutlinedInput-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  },
  noRecords: { padding: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 },
  modalContent: {
    width: 'fit-content',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    overflowY: 'auto',
    height: 'auto',
    '& .searchFilters, & .searchItemsWrapper, & .noRecordsFoundWrapper': {
      borderStyle: 'solid',
      borderWidth: '0 1px 1px',
      borderColor: 'divider',
    },
    '&:has(.MuiOutlinedInput-root:hover) .searchFilters, &:has(.MuiOutlinedInput-root:hover) .searchItemsWrapper, &:has(.MuiOutlinedInput-root:hover) .noRecordsFoundWrapper':
      {
        borderColor: 'text.primary',
      },
    '&:has(.MuiOutlinedInput-root.Mui-focused) .searchFilters, &:has(.MuiOutlinedInput-root.Mui-focused) .searchItemsWrapper, &:has(.MuiOutlinedInput-root.Mui-focused) .searchFilters, &:has(.MuiOutlinedInput-root.Mui-focused) .noRecordsFoundWrapper':
      {
        borderColor: 'primary.main',
        borderWidth: '0 2px 2px',
      },
  },
  searchItemsWrapper: {
    overflowY: 'auto',
    maxHeight: '70vh',
  },
  escButton: {
    minWidth: 0,
    height: 32,
    textTransform: 'none',
    borderRadius: 1,
  },
} satisfies Record<string, SxProps<Theme>>;

const handleOpenMouseDown = (event: MouseEvent<HTMLButtonElement>): void => {
  event.preventDefault();
};

function shortcutDisplay(): string[] {
  return formatForDisplay('Mod+K', { separatorToken: '|' }).split('|');
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

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Set<ResourceType>>(() => {
    return new Set(ALL_RESOURCE_TYPES);
  });

  const [hasResource, setHasResource] = useState<Record<ResourceType, boolean>>({
    dashboards: false,
    projects: false,
    globalDatasources: false,
    datasources: false,
  });

  const handleClose = useCallback((): void => setOpen(false), []);

  const handleTextFieldChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClearQuery = useCallback(() => setQuery(''), []);

  const handleSearchInputRef = useCallback((inputElement: HTMLInputElement | null): void => {
    inputElement?.focus();
  }, []);

  const handleIsResourceAvailable = useCallback((type: ResourceType, available: boolean): void => {
    setHasResource((prev) => (prev[type] === available ? prev : { ...prev, [type]: available }));
  }, []);

  const hasAnyResource = Object.values(hasResource).some(Boolean);
  const handleOpen = useCallback((): void => setOpen(true), []);
  useHandleShortCut(handleOpen);

  const mainButtonRef = useRef<HTMLButtonElement>(null);

  const [wrapperBounds, setWrapperBounds] = useState({ left: 0, width: 0, top: 0 });

  useEffect(() => {
    const element = mainButtonRef.current;
    if (!element) {
      return;
    }

    const updateBounds = (): void => {
      const rect = element.getBoundingClientRect();
      setWrapperBounds({ left: rect.left, width: rect.width, top: rect.top });
    };

    updateBounds();

    const observer = new ResizeObserver(updateBounds);
    observer.observe(element);

    window.addEventListener('resize', updateBounds);

    return (): void => {
      observer.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, []);

  return (
    <Paper sx={STATIC_SX.mainWrapper}>
      <Button
        data-testid={SEARCH_BAR_DATA_TEST_ID.searchButton}
        ref={mainButtonRef}
        size="small"
        fullWidth
        sx={STATIC_SX.mainButton}
        onMouseDown={handleOpenMouseDown}
        onClick={handleOpen}
      >
        <Box sx={STATIC_SX.magnifyWrapper} flexDirection="row" alignItems="center">
          <Magnify sx={STATIC_SX.magnify} fontSize="medium" />
          <Typography>{SEARCH_PLACE_HOLDER}</Typography>
        </Box>
        {!isMobileSize && (
          <Stack direction="row" spacing={0.5}>
            {shortcutDisplay().map((key) => {
              return <Chip key={key} label={key} size="small" />;
            })}
          </Stack>
        )}
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        disableAutoFocus={true}
        sx={STATIC_SX.modal}
      >
        <Paper
          elevation={0}
          // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
          sx={{
            ...STATIC_SX.modalContent,
            minWidth: wrapperBounds.width,
          }}
        >
          <TextField
            data-testid={SEARCH_BAR_DATA_TEST_ID.searchTextfield}
            size="medium"
            /* oxlint-disable-next-line jsx-a11y/no-autofocus */
            autoFocus={true}
            inputRef={handleSearchInputRef}
            variant="outlined"
            placeholder={SEARCH_PLACE_HOLDER}
            fullWidth
            sx={STATIC_SX.textField}
            value={query}
            onChange={handleTextFieldChange}
            // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Magnify sx={STATIC_SX.magnify} fontSize="medium" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {query && (
                      <IconButton size="small" onClick={handleClearQuery}>
                        <Close fontSize="small" />
                      </IconButton>
                    )}
                    <Button variant="outlined" size="small" onClick={handleClose} sx={STATIC_SX.escButton}>
                      esc
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
          {query.trim().length > 0 && !hasAnyResource && (
            <Box
              data-testid={SEARCH_BAR_DATA_TEST_ID.noRecordContainer}
              className="noRecordsFoundWrapper"
              sx={STATIC_SX.noRecords}
            >
              <EmoticonSadOutline fontSize="medium" />
              <Typography>No records found for {query}</Typography>
            </Box>
          )}
          <SearchBarFilters filters={filters} setFilters={setFilters} />
          {query.trim().length > 0 && (
            <Stack className="searchItemsWrapper" direction="column" sx={STATIC_SX.searchItemsWrapper}>
              {filters.has('dashboards') && (
                <SearchDashboardList query={query} handleClose={handleClose} isResources={handleIsResourceAvailable} />
              )}
              {filters.has('projects') && (
                <SearchProjectList query={query} handleClose={handleClose} isResources={handleIsResourceAvailable} />
              )}
              {filters.has('globalDatasources') && (
                <SearchGlobalDatasource
                  query={query}
                  handleClose={handleClose}
                  isResources={handleIsResourceAvailable}
                />
              )}
              {filters.has('datasources') && (
                <SearchDatasourceList query={query} handleClose={handleClose} isResources={handleIsResourceAvailable} />
              )}
            </Stack>
          )}
        </Paper>
      </Modal>
    </Paper>
  );
}
