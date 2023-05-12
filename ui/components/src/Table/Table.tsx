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
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { Checkbox, useTheme } from '@mui/material';
import { VirtualizedTable } from './VirtualizedTable';
import { TableCheckbox } from './TableCheckbox';

export type TableDensity = 'compact' | 'standard';

export interface TableProps<TableData> {
  height: number;
  width: number;
  data: TableData[];
  columns: Array<ColumnDef<TableData>>;
  density?: TableDensity;
  checkboxSelection?: boolean;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  getRowId?: CoreOptions<TableData>['getRowId'];
  getCheckboxColor?: (data: TableData) => string;
}

export function Table<TableData>({
  data,
  columns,
  density = 'standard',
  checkboxSelection,
  onRowSelectionChange,
  getCheckboxColor,
  getRowId,
  ...otherProps
}: TableProps<TableData>) {
  const theme = useTheme();
  const DEFAULT_GET_ROW_ID: CoreOptions<TableData>['getRowId'] = (data, index) => {
    return `${index}`;
  };
  const normalizedGetRowId = getRowId ?? DEFAULT_GET_ROW_ID;
  const initRowSelection: RowSelectionState = data.reduce((rowSelectionResult, row, index) => {
    rowSelectionResult[normalizedGetRowId(row, index)] = true;
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
      // const color = row.original.color;

      return (
        <TableCheckbox
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
          color={getCheckboxColor?.(row.original)}
          // color={row.original.color}
          // sx={{
          //   color: color,
          //   '&.Mui-checked': {
          //     color: color,
          //   },
          // }}
        />
      );
    },
  };
  const tableColumns = [...columns];
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

  // useEffect(() => {
  //   table.toggleAllRowsSelected(true);
  // }, []);

  return <VirtualizedTable {...otherProps} table={table} density={density} checkboxSelection={checkboxSelection} />;
}
