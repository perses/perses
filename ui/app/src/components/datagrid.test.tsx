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

import type { GridApi, GridCallbackDetails, GridColDef } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import type { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { act, render, renderHook } from '@testing-library/react';
import type { ReactElement, RefObject } from 'react';
import { createRef } from 'react';

import {
  getDataGridInitialStateSortByDisplayName,
  getDataGridInitialStateSortByName,
  usePersistedDataGridState,
} from './datagrid';

const STORAGE_KEY = 'PERSES_DATA_GRID_SETTINGS_V1_Variable';

const details = {
  api: {
    getAllColumns: (): Array<{ field: string }> => [{ field: 'version' }, { field: 'createdAt' }, { field: 'name' }],
  },
};
const callbackDetails = details as unknown as GridCallbackDetails;

const initialState: GridInitialStateCommunity = {
  ...getDataGridInitialStateSortByName(25),
  columns: { columnVisibilityModel: { version: false, createdAt: false } },
};

describe('data grid defaults', () => {
  it('uses the configured page size in initial state', () => {
    expect(getDataGridInitialStateSortByName(25).pagination?.paginationModel?.pageSize).toBe(25);
    expect(getDataGridInitialStateSortByDisplayName(50).pagination?.paginationModel?.pageSize).toBe(50);
  });
});

describe('usePersistedDataGridState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses the initial state when no settings are saved', () => {
    const { result } = renderHook(() => usePersistedDataGridState('Variable', initialState));

    expect(result.current.initialState).toEqual(initialState);
  });

  it('saves the settings changed by the user', () => {
    const { result } = renderHook(() => usePersistedDataGridState('Variable', initialState));

    result.current.onColumnVisibilityModelChange({ createdAt: false }, callbackDetails);
    result.current.onSortModelChange([{ field: 'updatedAt', sort: 'desc' }]);
    result.current.onPaginationModelChange({ page: 2, pageSize: 50 });

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({
      // "Show all" style models, where the visible columns are absent, are saved with an explicit value for each column.
      columnVisibilityModel: { version: true, createdAt: false, name: true },
      sortModel: [{ field: 'updatedAt', sort: 'desc' }],
      pageSize: 50,
    });
  });

  it('restores the saved settings on top of the initial state', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        columnVisibilityModel: { version: true, createdAt: false },
        sortModel: [{ field: 'updatedAt', sort: 'desc' }],
        pageSize: 50,
      }),
    );

    const { result } = renderHook(() => usePersistedDataGridState('Variable', initialState));

    expect(result.current.initialState).toEqual({
      // The saved model is merged over the default one.
      columns: { columnVisibilityModel: { version: true, createdAt: false } },
      sorting: { sortModel: [{ field: 'updatedAt', sort: 'desc' }] },
      pagination: { paginationModel: { page: 0, pageSize: 50 } },
    });
  });

  it('keeps the settings of each data grid separately', () => {
    const { result } = renderHook(() => usePersistedDataGridState('GlobalVariable', initialState));
    result.current.onPaginationModelChange({ page: 0, pageSize: 100 });

    const { result: otherResult } = renderHook(() => usePersistedDataGridState('Variable', initialState));

    expect(otherResult.current.initialState).toEqual(initialState);
  });

  it('ignores invalid saved settings', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        columnVisibilityModel: { createdAt: 'no' },
        sortModel: [{ field: 'name', sort: 'up' }],
        pageSize: 42,
      }),
    );

    const { result } = renderHook(() => usePersistedDataGridState('Variable', initialState));

    expect(result.current.initialState).toEqual(initialState);
  });

  it('ignores saved settings that are not valid JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{');

    const { result } = renderHook(() => usePersistedDataGridState('Variable', initialState));
    expect(result.current.initialState).toEqual(initialState);

    result.current.onPaginationModelChange({ page: 0, pageSize: 10 });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({ pageSize: 10 });
  });

  it('does not save the settings without a storage key', () => {
    const { result } = renderHook(() => usePersistedDataGridState(undefined, initialState));

    result.current.onSortModelChange([{ field: 'updatedAt', sort: 'desc' }]);

    expect(result.current.initialState).toEqual(initialState);
    expect(window.localStorage.length).toBe(0);
  });
});

describe('usePersistedDataGridState with a data grid', () => {
  const COLUMNS = [{ field: 'name' }, { field: 'version' }, { field: 'extra' }];
  const ROWS = Array.from({ length: 30 }, (_, i) => ({ id: i, name: `row${i}`, version: i, extra: i }));

  const apiRef = createRef<GridApi>() as RefObject<GridApi>;

  function PersistedDataGrid({
    state,
    columns = COLUMNS,
  }: {
    state: GridInitialStateCommunity;
    columns?: GridColDef[];
  }): ReactElement {
    const persisted = usePersistedDataGridState('Variable', state);
    return (
      <DataGrid
        apiRef={apiRef}
        rows={ROWS}
        columns={columns}
        pageSizeOptions={[10, 25, 50]}
        initialState={persisted.initialState}
        onColumnVisibilityModelChange={persisted.onColumnVisibilityModelChange}
        onSortModelChange={persisted.onSortModelChange}
        onPaginationModelChange={persisted.onPaginationModelChange}
      />
    );
  }

  const state: GridInitialStateCommunity = {
    ...getDataGridInitialStateSortByName(10),
    columns: { columnVisibilityModel: { version: false } },
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('does not save the page size when only the page changes', () => {
    render(<PersistedDataGrid state={state} />);

    act(() => apiRef.current?.setPage(1));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('saves the page size when it changes', () => {
    render(<PersistedDataGrid state={state} />);

    act(() => apiRef.current?.setPageSize(25));

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({ pageSize: 25 });
  });

  it('keeps the columns hidden by default hidden after "Show all"', () => {
    const { unmount } = render(<PersistedDataGrid state={state} />);

    act(() => apiRef.current?.setColumnVisibilityModel({}));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '').columnVisibilityModel).toEqual({
      name: true,
      version: true,
      extra: true,
    });
    unmount();

    // A column hidden by default is added after the settings were saved.
    render(
      <PersistedDataGrid
        state={{ ...state, columns: { columnVisibilityModel: { version: false, added: false } } }}
        columns={[...COLUMNS, { field: 'added' }]}
      />,
    );

    expect(apiRef.current?.getVisibleColumns().map(({ field }) => field)).toEqual(['name', 'version', 'extra']);
  });
});
