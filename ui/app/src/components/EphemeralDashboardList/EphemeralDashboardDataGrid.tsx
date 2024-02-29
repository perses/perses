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

import { DataGrid, GridRow, GridColumnHeaders } from '@mui/x-data-grid';
import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import {
  DataGridProperties,
  CommonRow,
  DATA_GRID_INITIAL_STATE_SORT_BY_DISPLAY_NAME,
  GridToolbar,
  NoContentRowOverlay,
  PAGE_SIZE_OPTIONS,
  DATA_GRID_STYLES,
} from '../datagrid';

// https://mui.com/x/react-data-grid/performance/
const MemoizedRow = memo(GridRow);
const MemoizedColumnHeaders = memo(GridColumnHeaders);

export interface Row extends CommonRow {
  project: string;
  displayName: string;
  expireAt: string;
}

function NoEphemeralDashboardRowOverlay() {
  return <NoContentRowOverlay resource="ephemeral dashboards" />;
}

export function EphemeralDashboardDataGrid(props: DataGridProperties<Row>) {
  const { columns, rows, initialState, hideToolbar, isLoading } = props;

  const navigate = useNavigate();

  // Merging default initial state with the props initial state (props initial state will overwrite properties)
  const mergedInitialState = useMemo(() => {
    return {
      ...DATA_GRID_INITIAL_STATE_SORT_BY_DISPLAY_NAME,
      ...(initialState || {}),
    } as GridInitialStateCommunity;
  }, [initialState]);

  return (
    <DataGrid
      autoHeight={true}
      onRowClick={(params) => navigate(`/projects/${params.row.project}/ephemeraldashboards/${params.row.name}`)}
      rows={rows}
      columns={columns}
      getRowId={(row) => row.name}
      loading={isLoading}
      slots={
        hideToolbar
          ? { noRowsOverlay: NoEphemeralDashboardRowOverlay }
          : {
              toolbar: GridToolbar,
              row: MemoizedRow,
              columnHeaders: MemoizedColumnHeaders,
              noRowsOverlay: NoEphemeralDashboardRowOverlay,
            }
      }
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      initialState={mergedInitialState}
      sx={DATA_GRID_STYLES}
    ></DataGrid>
  );
}
