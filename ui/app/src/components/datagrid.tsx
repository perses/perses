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

import { Stack } from '@mui/material';
import type {
  GridCallbackDetails,
  GridColDef,
  GridColumnVisibilityModel,
  GridPaginationModel,
  GridSortModel,
  GridValidRowModel,
} from '@mui/x-data-grid';
import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import type { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import type { Kind } from '@perses-dev/client';
import type { ReactElement } from 'react';
import { useCallback, useRef, useState } from 'react';

export const getDataGridInitialStateSortByName = (pageSize: number): GridInitialStateCommunity => ({
  columns: {
    columnVisibilityModel: {},
  },
  sorting: {
    sortModel: [{ field: 'name', sort: 'asc' }],
  },
  pagination: {
    paginationModel: { pageSize, page: 0 },
  },
});

export const getDataGridInitialStateSortByDisplayName = (pageSize: number): GridInitialStateCommunity => ({
  columns: {
    columnVisibilityModel: {},
  },
  sorting: {
    sortModel: [{ field: 'displayName', sort: 'asc' }],
  },
  pagination: {
    paginationModel: { pageSize, page: 0 },
  },
});

export const DATA_GRID_STYLES = {
  border: 'none',
  // Disable cell focus outline
  '.MuiDataGrid-columnHeader:focus': {
    outline: 'none',
  },
  '.MuiDataGrid-cell:focus': {
    outline: 'none',
  },
  '.MuiDataGrid-cell:focus-within': {
    outline: 'none',
  },
  // Pointer cursor on rows
  '& .MuiDataGrid-row:hover': {
    cursor: 'pointer',
  },
  // Lighter column headers
  '& .MuiDataGrid-columnHeaders': {
    borderBottom: '1px solid',
    borderColor: 'divider',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'text.secondary',
  },
  // Subtle row borders
  '& .MuiDataGrid-row': {
    '&:last-of-type .MuiDataGrid-cell': {
      borderBottom: 'none',
    },
  },
  // Clean footer
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid',
    borderColor: 'divider',
  },
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DATA_GRID_SLOT_PROPS = {
  panel: {
    placement: 'top-end' as const,
  },
};

export function GridToolbar(): ReactElement {
  return (
    <GridToolbarContainer sx={{ px: 2, py: 1.5, gap: 1 }}>
      <GridToolbarQuickFilter
        sx={{
          flex: 1,
          maxWidth: 360,
          '& .MuiInputBase-root': {
            fontSize: '0.875rem',
          },
        }}
      />
      <Stack direction="row" sx={{ ml: 'auto' }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
      </Stack>
    </GridToolbarContainer>
  );
}

export interface CommonRow {
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// Identifies a data grid in the local storage: the kind of the resources it lists, or the plugin list.
export type DataGridStorageKey = Kind | 'Plugin';

export interface DataGridProperties<T extends GridValidRowModel> {
  columns: Array<GridColDef<T>>;
  rows: T[];
  initialState?: GridInitialStateCommunity;
  // Identifies the data grid to save its settings in the local storage, see usePersistedDataGridState.
  storageKey?: DataGridStorageKey;
  hideToolbar?: boolean;
  isLoading?: boolean;
}

export interface DataGridPropertiesWithCallback<T extends GridValidRowModel> extends DataGridProperties<T> {
  onRowClick: (name: string, project?: string) => void;
}

// The version must be increased when the format or the meaning of the saved settings changes, so the old ones are ignored.
const DATA_GRID_SETTINGS_KEY_PREFIX = 'PERSES_DATA_GRID_SETTINGS_V1_';

/**
 * Settings of a data grid changed by the user, saved in the local storage.
 */
interface DataGridSettings {
  columnVisibilityModel?: GridColumnVisibilityModel;
  sortModel?: GridSortModel;
  pageSize?: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isColumnVisibilityModel(value: unknown): value is GridColumnVisibilityModel {
  return isObject(value) && Object.values(value).every((visible) => typeof visible === 'boolean');
}

function isSortModel(value: unknown): value is GridSortModel {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isObject(item) &&
        typeof item.field === 'string' &&
        (item.sort === 'asc' || item.sort === 'desc' || item.sort === null || item.sort === undefined),
    )
  );
}

function isPageSize(value: unknown): value is number {
  return typeof value === 'number' && PAGE_SIZE_OPTIONS.includes(value);
}

/**
 * Read the settings of a data grid from the local storage, ignoring the ones that are invalid.
 */
function loadDataGridSettings(storageKey: DataGridStorageKey): DataGridSettings {
  let value: unknown;
  try {
    value = JSON.parse(window.localStorage.getItem(DATA_GRID_SETTINGS_KEY_PREFIX + storageKey) ?? '{}');
  } catch {
    return {};
  }
  if (!isObject(value)) {
    return {};
  }
  const { columnVisibilityModel, sortModel, pageSize } = value;
  return {
    columnVisibilityModel: isColumnVisibilityModel(columnVisibilityModel) ? columnVisibilityModel : undefined,
    sortModel: isSortModel(sortModel) ? sortModel : undefined,
    pageSize: isPageSize(pageSize) ? pageSize : undefined,
  };
}

function saveDataGridSettings(storageKey: DataGridStorageKey, settings: DataGridSettings): void {
  try {
    window.localStorage.setItem(
      DATA_GRID_SETTINGS_KEY_PREFIX + storageKey,
      JSON.stringify({ ...loadDataGridSettings(storageKey), ...settings }),
    );
  } catch {
    // The local storage is unavailable or full: the settings are simply not saved.
  }
}

/**
 * Override the initial state of a data grid with the settings saved by the user.
 */
function applyDataGridSettings(
  initialState: GridInitialStateCommunity,
  { columnVisibilityModel, sortModel, pageSize }: DataGridSettings,
): GridInitialStateCommunity {
  return {
    ...initialState,
    // The saved model has an explicit value for every column known when it was saved, so it is merged over the default
    // one: only the columns added since then get their default visibility.
    ...(columnVisibilityModel && {
      columns: {
        ...initialState.columns,
        columnVisibilityModel: { ...initialState.columns?.columnVisibilityModel, ...columnVisibilityModel },
      },
    }),
    ...(sortModel && { sorting: { ...initialState.sorting, sortModel } }),
    ...(pageSize !== undefined && {
      pagination: { ...initialState.pagination, paginationModel: { page: 0, pageSize } },
    }),
  };
}

export interface PersistedDataGridState {
  initialState: GridInitialStateCommunity;
  onColumnVisibilityModelChange: (model: GridColumnVisibilityModel, details: GridCallbackDetails) => void;
  onSortModelChange: (model: GridSortModel) => void;
  onPaginationModelChange: (model: GridPaginationModel) => void;
}

/**
 * Keep the settings of a data grid that the user changes (column visibility, sorting and page size) in the
 * local storage, so they are restored the next time the data grid is displayed.
 * The returned properties are meant to be passed to the DataGrid component, which must be mounted together with the
 * component calling this hook.
 * @param storageKey Identifies the data grid in the local storage. The settings are not saved when it is undefined.
 * It must not change while the data grid is mounted.
 * @param initialState Initial state of the data grid, overridden by the saved settings.
 */
export function usePersistedDataGridState(
  storageKey: DataGridStorageKey | undefined,
  initialState: GridInitialStateCommunity,
): PersistedDataGridState {
  // The data grid only reads its initial state when it is mounted, so the settings are loaded only once.
  const [persistedInitialState] = useState(() =>
    storageKey === undefined ? initialState : applyDataGridSettings(initialState, loadDataGridSettings(storageKey)),
  );
  // The data grid also calls onPaginationModelChange when only the page changes.
  const pageSizeRef = useRef(persistedInitialState.pagination?.paginationModel?.pageSize);

  const onColumnVisibilityModelChange = (model: GridColumnVisibilityModel, { api }: GridCallbackDetails): void => {
    if (storageKey === undefined) {
      return;
    }
    // "Show all" removes the visible columns from the model: save an explicit value for every column instead.
    const columnVisibilityModel = Object.fromEntries(
      api.getAllColumns().map(({ field }) => [field, model[field] !== false]),
    );
    saveDataGridSettings(storageKey, { columnVisibilityModel });
  };

  const onSortModelChange = (sortModel: GridSortModel): void => {
    if (storageKey !== undefined) {
      saveDataGridSettings(storageKey, { sortModel });
    }
  };

  const onPaginationModelChange = ({ pageSize }: GridPaginationModel): void => {
    if (pageSize === pageSizeRef.current) {
      return;
    }
    pageSizeRef.current = pageSize;
    if (storageKey !== undefined) {
      saveDataGridSettings(storageKey, { pageSize });
    }
  };

  return {
    initialState: persistedInitialState,
    onColumnVisibilityModelChange,
    onSortModelChange,
    onPaginationModelChange,
  };
}
