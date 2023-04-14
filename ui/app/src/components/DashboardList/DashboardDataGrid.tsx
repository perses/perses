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
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridRow,
  GridColumnHeaders,
} from '@mui/x-data-grid';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';

// https://mui.com/x/react-data-grid/performance/
const MemoizedRow = memo(GridRow);
const MemoizedColumnHeaders = memo(GridColumnHeaders);

export interface Row {
  project: string;
  name: string;
  displayName: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  viewedAt?: string;
}

function DashboardsGridToolbar() {
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

function NoDashboardRowOverlay() {
  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography>No dashboards</Typography>
    </Stack>
  );
}

export interface DashboardDataGridProperties {
  columns: Array<GridColDef<Row>>;
  rows: Row[];
  initialState?: GridInitialStateCommunity;
  hideToolbar?: boolean;
}

export function DashboardDataGrid(props: DashboardDataGridProperties) {
  const { columns, rows, initialState, hideToolbar } = props;

  const navigate = useNavigate();

  return (
    <DataGrid
      autoHeight={true}
      onRowClick={(params) => navigate(`/projects/${params.row.project}/dashboards/${params.row.name}`)}
      rows={rows}
      columns={columns}
      getRowId={(row) => row.name}
      slots={
        hideToolbar
          ? { noRowsOverlay: NoDashboardRowOverlay }
          : {
              toolbar: DashboardsGridToolbar,
              row: MemoizedRow,
              columnHeaders: MemoizedColumnHeaders,
              noRowsOverlay: NoDashboardRowOverlay,
            }
      }
      pageSizeOptions={[10, 25, 50, 100]}
      initialState={initialState}
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
