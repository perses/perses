import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  RowSelectionState,
  OnChangeFn,
  CoreOptions,
  AccessorKeyColumnDef,
} from '@tanstack/react-table';
import { Checkbox, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { VirtualizedTable } from './VirtualizedTable';
import { TableCheckbox } from './TableCheckbox';
import { TableDensity } from './table-model';

// Only exposing a very simplified version of the very extensive column definitions
// possible with tanstack table to make it easier for us to control rendering
// and functionality.
export interface TableColumnConfig<TableData>
  // Any needed to work around some typing issues with tanstack query.
  // https://github.com/TanStack/table/issues/4241
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extends Pick<AccessorKeyColumnDef<TableData, any>, 'accessorKey' | 'cell'> {
  /**
   * Text to display in the header for the column.
   */
  header: string;

  // Tanstack Table does not support an "auto" value to naturally size to fit
  // the space in a table. Adding a custom setting to manage this ourselves.
  /**
   * Width of the column when rendered in a table. It should be a number in pixels
   * or "auto" to allow the table to automatically adjust the width to fill
   * space.
   * @default 'auto'
   */
  size?: number | 'auto';
}

export interface TableProps<TableData> {
  height: number;
  width: number;
  data: TableData[];
  columns: Array<TableColumnConfig<TableData>>;
  density?: TableDensity;
  checkboxSelection?: boolean;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  getRowId?: CoreOptions<TableData>['getRowId'];
  getCheckboxColor?: (data: TableData) => string;
  rowSelection?: RowSelectionState;
}

function persesColumnToTanstackColumn<TableData>(columns: Array<TableColumnConfig<TableData>>) {
  const tableCols: Array<ColumnDef<TableData>> = columns.map(({ size, ...otherProps }) => {
    // Tanstack Table does not support an "auto" value to naturally size to fit
    // the space in a table. We translate our custom "auto" setting to 0 size
    // for these columns, so it is easy to fall back to auto when rendering.
    // Taking from a recommendation in this github discussion:
    // https://github.com/TanStack/table/discussions/4179#discussioncomment-3631326
    const sizeProps =
      size === 'auto' || size === undefined
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

  return tableCols;
}

// TODO: perf tuning

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
  getRowId: initGetRowId,
  rowSelection = {},
  ...otherProps
}: TableProps<TableData>) {
  const theme = useTheme();
  const DEFAULT_GET_ROW_ID: CoreOptions<TableData>['getRowId'] = (data, index) => {
    return `${index}`;
  };
  const getRowId = initGetRowId ?? DEFAULT_GET_ROW_ID;

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (rowSelectionUpdater) => {
    const newRowSelection =
      typeof rowSelectionUpdater === 'function' ? rowSelectionUpdater(rowSelection) : rowSelectionUpdater;
    onRowSelectionChange?.(newRowSelection);
  };

  const checkboxColumn: ColumnDef<TableData> = useMemo(() => {
    return {
      id: 'checkboxRowSelect',
      size: 32,
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
    };
  }, [density, getCheckboxColor, theme.palette.text.primary]);

  const tableColumns: Array<ColumnDef<TableData>> = useMemo(() => {
    const initTableColumns = persesColumnToTanstackColumn(columns);

    if (checkboxSelection) {
      initTableColumns.unshift(checkboxColumn);
    }

    return initTableColumns;
  }, [checkboxColumn, checkboxSelection, columns]);

  const handleRowClick = (rowId: string) => {
    table.getRow(rowId).toggleSelected();
  };

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

  return <VirtualizedTable {...otherProps} table={table} density={density} onRowClick={handleRowClick} />;
}
