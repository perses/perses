import {
  useReactTable,
  TableOptions,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
  getFilteredRowModel,
  OnChangeFn,
  CoreOptions,
  AccessorColumnDef,
  AccessorKeyColumnDef,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { Checkbox, useTheme } from '@mui/material';
import { VirtualizedTable } from './VirtualizedTable';
import { TableCheckbox } from './TableCheckbox';
import { TableDensity } from './layoutUtils';

// Only exposing a very simplified version of the very extensive column definitions
// possible with tanstack table to make it easier for us to control rendering
// and functionality.
export interface TableColumnConfig<TableData> extends Pick<AccessorKeyColumnDef<TableData>, 'accessorKey' | 'cell'> {
  header: string;

  // Tanstack Table does not support an "auto" value to naturally size to fit
  // the space in a table. Adding a custom setting to manage this ourselves.
  size?: number | 'auto';
}

export interface TableProps<TableData> {
  height: number;
  width: number;
  data: TableData[];
  columns: Array<TableColumnConfig<TableData>>;
  // columns: Array<ColumnDef<TableData>>;
  density?: TableDensity;
  checkboxSelection?: boolean;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  getRowId?: CoreOptions<TableData>['getRowId'];
  getCheckboxColor?: (data: TableData) => string;
}

// TODO: perf tuning

export function Table<TableData>({
  data,
  columns,
  density = 'standard',
  checkboxSelection,
  onRowSelectionChange,
  getCheckboxColor,
  getRowId: initGetRowId,
  ...otherProps
}: TableProps<TableData>) {
  const theme = useTheme();
  const DEFAULT_GET_ROW_ID: CoreOptions<TableData>['getRowId'] = (data, index) => {
    return `${index}`;
  };
  const getRowId = initGetRowId ?? DEFAULT_GET_ROW_ID;
  const initRowSelection: RowSelectionState = data.reduce((rowSelectionResult, row, index) => {
    rowSelectionResult[getRowId(row, index)] = true;
    return rowSelectionResult;
  }, {} as RowSelectionState);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initRowSelection);

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (rowSelectionUpdater) => {
    setRowSelection((oldRowSelection) => {
      const newRowSelection =
        typeof rowSelectionUpdater === 'function' ? rowSelectionUpdater(oldRowSelection) : rowSelectionUpdater;

      onRowSelectionChange?.(newRowSelection);

      return newRowSelection;
    });
  };

  const checkboxColumn: ColumnDef<TableData> = {
    id: 'checkboxRowSelect',
    size: 32,
    header: ({ table }) => {
      return (
        <TableCheckbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          color={theme.palette.text.primary}
        />
      );
    },
    cell: ({ row }) => {
      return (
        <TableCheckbox
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
          color={getCheckboxColor?.(row.original)}
        />
      );
    },
  };
  const tableColumns: Array<ColumnDef<TableData>> = [...columns].map(({ size, ...otherProps }) => {
    // Tanstack Table does not support an "auto" value to naturally size to fit
    // the space in a table. We translate our custom "auto" setting to 0 size
    // for these columns, so it is easy to fall back to auto when rendering.
    // Taking from a recommendation in this github discussion:
    // https://github.com/TanStack/table/discussions/4179#discussioncomment-3631326
    const sizeProps =
      size === 'auto'
        ? {
            size: 0,
            minSize: 0,
            maxSize: 0,
          }
        : {
            size,
          };

    const result = {
      ...otherProps,
      ...sizeProps,
    };

    return result;
  });
  if (checkboxSelection) {
    tableColumns.unshift(checkboxColumn);
  }

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

  console.log(`size: ${table.getTotalSize()}`);

  return <VirtualizedTable {...otherProps} table={table} density={density} checkboxSelection={checkboxSelection} />;
}
