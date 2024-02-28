// Copyright 2023 The Perses Authors
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
import { DataGrid, GridColDef, GridRow, GridColumnHeaders } from '@mui/x-data-grid';
import { memo, useMemo } from 'react';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { GridToolbar } from '../GridToolbar';

const DATA_GRID_INITIAL_STATE = {
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

// https://mui.com/x/react-data-grid/performance/
const MemoizedRow = memo(GridRow);
const MemoizedColumnHeaders = memo(GridColumnHeaders);

export interface Row {
  default: boolean;
  project?: string;
  name: string;
  displayName: string;
  description: string;
  type: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  viewedAt?: string;
}

function NoDatasourceRowOverlay() {
  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography>No datasources</Typography>
    </Stack>
  );
}

export interface DatasourceDataGridProperties {
  columns: Array<GridColDef<Row>>;
  rows: Row[];
  initialState?: GridInitialStateCommunity;
  hideToolbar?: boolean;
  isLoading?: boolean;
  onRowClick: (name: string, project?: string) => void;
}

export function DatasourceDataGrid(props: DatasourceDataGridProperties) {
  const { columns, rows, initialState, hideToolbar, isLoading, onRowClick } = props;

  // Merging default initial state with the props initial state (props initial state will overwrite properties)
  const mergedInitialState = useMemo(() => {
    return {
      ...DATA_GRID_INITIAL_STATE,
      ...(initialState || {}),
    } as GridInitialStateCommunity;
  }, [initialState]);

  return (
    <DataGrid
      disableRowSelectionOnClick
      autoHeight={true}
      onRowClick={(params) => {
        onRowClick(params.row.name, params.row.project);
      }}
      rows={rows}
      columns={columns}
      getRowId={(row) => row.name}
      loading={isLoading}
      slots={
        hideToolbar
          ? { noRowsOverlay: NoDatasourceRowOverlay }
          : {
              toolbar: GridToolbar,
              row: MemoizedRow,
              columnHeaders: MemoizedColumnHeaders,
              noRowsOverlay: NoDatasourceRowOverlay,
            }
      }
      pageSizeOptions={[10, 25, 50, 100]}
      initialState={mergedInitialState}
      sx={{
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
      }}
    ></DataGrid>
  );
}
