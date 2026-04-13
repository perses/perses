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
import {
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridValidRowModel,
} from '@mui/x-data-grid';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { ReactElement } from 'react';

export const DATA_GRID_INITIAL_STATE_SORT_BY_NAME = {
  columns: {
    columnVisibilityModel: {},
  },
  sorting: {
    sortModel: [{ field: 'name', sort: 'asc' }],
  },
  pagination: {
    paginationModel: { pageSize: 10, page: 0 },
  },
};

export const DATA_GRID_INITIAL_STATE_SORT_BY_DISPLAY_NAME = {
  columns: {
    columnVisibilityModel: {},
  },
  sorting: {
    sortModel: [{ field: 'displayName', sort: 'asc' }],
  },
  pagination: {
    paginationModel: { pageSize: 10, page: 0 },
  },
};

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

export interface DataGridProperties<T extends GridValidRowModel> {
  columns: Array<GridColDef<T>>;
  rows: T[];
  initialState?: GridInitialStateCommunity;
  hideToolbar?: boolean;
  isLoading?: boolean;
}

export interface DataGridPropertiesWithCallback<T extends GridValidRowModel> extends DataGridProperties<T> {
  onRowClick: (name: string, project?: string) => void;
}
