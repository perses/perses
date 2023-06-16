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

import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  RowSelectionState,
  OnChangeFn,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTheme } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { VirtualizedTable } from './VirtualizedTable';
import { TableCheckbox } from './TableCheckbox';
import { TableProps, persesColumnsToTanstackColumns } from './model/table-model';

const DEFAULT_GET_ROW_ID = (data: unknown, index: number) => {
  return `${index}`;
};

// Setting these defaults one enables them to be consistent across renders instead
// of being recreated every time, which can be important for perf because react
// does not do deep equality checking for objects and arrays.
const DEFAULT_ROW_SELECTION: NonNullable<TableProps<unknown>['rowSelection']> = {};
const DEFAULT_SORTING: NonNullable<TableProps<unknown>['sorting']> = [];

/**
 * Component used to render tabular data in Perses use cases. This component is
 * **not** intended to be a general use data table for use cases unrelated to Perses.
 *
 * **Note: This component is currently experimental and is likely to have significant breaking changes in the near future. Use with caution outside of the core Perses codebase.**
 */
export function Table<TableData>({
  data,
  columns,
  density = 'standard',
  checkboxSelection,
  onRowSelectionChange,
  onSortingChange,
  getCheckboxColor,
  getRowId = DEFAULT_GET_ROW_ID,
  rowSelection = DEFAULT_ROW_SELECTION,
  sorting = DEFAULT_SORTING,
  ...otherProps
}: TableProps<TableData>) {
  const theme = useTheme();

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (rowSelectionUpdater) => {
    const newRowSelection =
      typeof rowSelectionUpdater === 'function' ? rowSelectionUpdater(rowSelection) : rowSelectionUpdater;
    onRowSelectionChange?.(newRowSelection);
  };

  const handleSortingChange: OnChangeFn<SortingState> = (sortingUpdater) => {
    const newSorting = typeof sortingUpdater === 'function' ? sortingUpdater(sorting) : sortingUpdater;
    onSortingChange?.(newSorting);
  };

  const checkboxColumn: ColumnDef<TableData> = useMemo(() => {
    return {
      id: 'checkboxRowSelect',
      size: 28,
      header: ({ table }) => {
        return (
          <TableCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            color={theme.palette.text.primary}
            density={density}
          />
        );
      },
      cell: ({ row }) => {
        return (
          <TableCheckbox
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected()}
            onChange={(e) => {
              row.getToggleSelectedHandler()(e);
            }}
            color={getCheckboxColor?.(row.original)}
            density={density}
          />
        );
      },
      enableSorting: false,
    };
  }, [density, getCheckboxColor, theme.palette.text.primary]);

  const tableColumns: Array<ColumnDef<TableData>> = useMemo(() => {
    const initTableColumns = persesColumnsToTanstackColumns(columns);

    if (checkboxSelection) {
      initTableColumns.unshift(checkboxColumn);
    }

    return initTableColumns;
  }, [checkboxColumn, checkboxSelection, columns]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: !!checkboxSelection,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: handleSortingChange,
    // For now, defaulting to sort by descending first. We can expose the ability
    // to customize it if/when we have use cases for it.
    sortDescFirst: true,
    state: {
      rowSelection,
      sorting,
    },
  });

  const handleRowClick = useCallback(
    (rowId: string) => {
      table.getRow(rowId).toggleSelected();
    },
    [table]
  );

  return (
    <VirtualizedTable
      {...otherProps}
      density={density}
      onRowClick={handleRowClick}
      rows={table.getRowModel().rows}
      columns={table.getAllFlatColumns()}
      headers={table.getHeaderGroups()}
    />
  );
}
