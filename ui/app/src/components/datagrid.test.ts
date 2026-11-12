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

import { renderHook } from '@testing-library/react';

import {
  getDataGridInitialStateSortByDisplayName,
  getDataGridInitialStateSortByName,
  usePersistedDataGridState,
} from './datagrid';

const STORAGE_KEY = 'PERSES_DATA_GRID_SETTINGS_Variable';

const initialState = {
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

    result.current.onColumnVisibilityModelChange({ createdAt: false });
    result.current.onSortModelChange([{ field: 'updatedAt', sort: 'desc' }]);
    result.current.onPaginationModelChange({ page: 2, pageSize: 50 });

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({
      columnVisibilityModel: { createdAt: false },
      sortModel: [{ field: 'updatedAt', sort: 'desc' }],
      pageSize: 50,
    });
  });

  it('restores the saved settings on top of the initial state', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        // A visible column can be absent from the model, e.g. after clicking on "Show all".
        columnVisibilityModel: { createdAt: false },
        sortModel: [{ field: 'updatedAt', sort: 'desc' }],
        pageSize: 50,
      }),
    );

    const { result } = renderHook(() => usePersistedDataGridState('Variable', initialState));

    expect(result.current.initialState).toEqual({
      columns: { columnVisibilityModel: { createdAt: false } },
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
