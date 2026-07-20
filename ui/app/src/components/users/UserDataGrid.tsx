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

import { DataGrid, GridRow, GridColumnHeaders, GridRowParams } from '@mui/x-data-grid';
import { memo, ReactElement, useCallback, useMemo } from 'react';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { NoDataOverlay } from '@perses-dev/components';
import {
  CommonRow,
  DATA_GRID_INITIAL_STATE_SORT_BY_NAME,
  GridToolbar,
  DataGridPropertiesWithCallback,
  PAGE_SIZE_OPTIONS,
  DATA_GRID_STYLES,
  DATA_GRID_SLOT_PROPS,
} from '../datagrid';

// https://mui.com/x/react-data-grid/performance/
const MemoizedRow = memo(GridRow);
const MemoizedColumnHeaders = memo(GridColumnHeaders);

export interface Row extends CommonRow {
  nativeProvider: boolean;
  oauthProviders: boolean;
}

function NoUserRowOverlay(): ReactElement {
  return <NoDataOverlay resource="users" />;
}

const getRowId = (row: Row): string => row.name;

// Stable slots objects: DataGrid is memoized, so recreating these on each render would break its memoization
const SLOTS = {
  toolbar: GridToolbar,
  row: MemoizedRow,
  columnHeaders: MemoizedColumnHeaders,
  noRowsOverlay: NoUserRowOverlay,
};
const SLOTS_HIDDEN_TOOLBAR = { noRowsOverlay: NoUserRowOverlay };

export function UserDataGrid(props: DataGridPropertiesWithCallback<Row>): ReactElement {
  const { columns, rows, initialState, hideToolbar, isLoading, onRowClick } = props;

  // Merging default initial state with the props initial state (props initial state will overwrite properties)
  const mergedInitialState = useMemo(() => {
    return {
      ...DATA_GRID_INITIAL_STATE_SORT_BY_NAME,
      ...(initialState || {}),
    } as GridInitialStateCommunity;
  }, [initialState]);

  const handleRowClick = useCallback(
    (params: GridRowParams<Row>): void => {
      onRowClick(params.row.name);
    },
    [onRowClick]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <DataGrid
        disableRowSelectionOnClick
        onRowClick={handleRowClick}
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        loading={isLoading}
        slots={hideToolbar ? SLOTS_HIDDEN_TOOLBAR : SLOTS}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        initialState={mergedInitialState}
        slotProps={DATA_GRID_SLOT_PROPS}
        sx={DATA_GRID_STYLES}
      />
    </div>
  );
}
