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

import { Stack, Typography } from '@mui/material';
import {
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridValidRowModel,
} from '@mui/x-data-grid';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';

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
  // disable cell selection style
  '.MuiDataGrid-columnHeader:focus': {
    outline: 'none',
  },
  // disable cell selection style
  '.MuiDataGrid-cell:focus': {
    outline: 'none',
  },
  // pointer cursor on ALL rows
  '& .MuiDataGrid-row:hover': {
    cursor: 'pointer',
  },
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function GridToolbar() {
  return (
    <GridToolbarContainer>
      <Stack direction="row" width="100%" gap={4} m={2}>
        <Stack sx={{ flexShrink: 1 }} width="100%">
          <GridToolbarQuickFilter sx={{ width: '100%' }} />
        </Stack>
        <Stack direction="row" sx={{ flexShrink: 3 }} width="100%">
          <GridToolbarColumnsButton sx={{ width: '100%' }} />
          <GridToolbarFilterButton sx={{ width: '100%' }} />
        </Stack>
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
export interface NoContentRowOverlayProps {
  resource: string;
}

export function NoContentRowOverlay(props: NoContentRowOverlayProps) {
  const { resource } = props;

  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography>No {resource}</Typography>
    </Stack>
  );
}
