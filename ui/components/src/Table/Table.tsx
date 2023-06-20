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
  Row,
  Table as TanstackTable,
} from '@tanstack/react-table';
import { useTheme } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { VirtualizedTable } from './VirtualizedTable';
import { TableCheckbox } from './TableCheckbox';
import { TableProps, persesColumnsToTanstackColumns } from './model/table-model';

const DEFAULT_GET_ROW_ID = (data: unknown, index: number) => {
  return `${index}`;
};

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
  getCheckboxColor,
  getRowId = DEFAULT_GET_ROW_ID,
  rowSelection = {},
  rowSelectionVariant = 'standard',
  ...otherProps
}: TableProps<TableData>) {
  const theme = useTheme();

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (rowSelectionUpdater) => {
    const newRowSelection =
      typeof rowSelectionUpdater === 'function' ? rowSelectionUpdater(rowSelection) : rowSelectionUpdater;
    onRowSelectionChange?.(newRowSelection);
  };

  const handleRowSelectionEvent = useCallback(
    (table: TanstackTable<TableData>, row: Row<TableData>, isModified: boolean) => {
      if (rowSelectionVariant === 'standard' || isModified) {
        row.toggleSelected();
      } else {
        // Legend variant (when action not modified with shift/meta key).
        // Note that this behavior needs to be kept in sync with behavior in
        // the Legend component for list-based legends.
        if (row.getIsSelected() && !table.getIsAllRowsSelected()) {
          // Row was already selected. Revert to select all.
          table.toggleAllRowsSelected();
        } else {
          // Focus the selected row.
          onRowSelectionChange?.({
            [row.id]: true,
          });
        }
      }
    },
    [onRowSelectionChange, rowSelectionVariant]
  );

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, table: TanstackTable<TableData>, row: Row<TableData>) => {
      const nativePointerEvent =
        e.nativeEvent && (e.nativeEvent instanceof MouseEvent || e.nativeEvent instanceof KeyboardEvent)
          ? (e.nativeEvent as PointerEvent)
          : undefined;
      const isModifed = !!nativePointerEvent?.metaKey || !!nativePointerEvent?.shiftKey;
      handleRowSelectionEvent(table, row, isModifed);
    },
    [handleRowSelectionEvent]
  );

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
      cell: ({ row, table }) => {
        return (
          <TableCheckbox
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected()}
            onChange={(e) => {
              handleCheckboxChange(e, table, row);
            }}
            color={getCheckboxColor?.(row.original)}
            density={density}
          />
        );
      },
    };
  }, [theme.palette.text.primary, density, getCheckboxColor, handleCheckboxChange]);

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
    enableRowSelection: !!checkboxSelection,
    onRowSelectionChange: handleRowSelectionChange,
    state: {
      rowSelection,
    },
  });

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>, rowId: string) => {
      const row = table.getRow(rowId);
      const isModifiedClick = e.metaKey || e.shiftKey;
      handleRowSelectionEvent(table, row, isModifiedClick);
    },
    [handleRowSelectionEvent, table]
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
