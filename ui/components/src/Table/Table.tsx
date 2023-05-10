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
} from '@tanstack/react-table';
import { VirtualizedTable } from './VirtualizedTable';

export interface TableProps<TableData> {
  height: number;
  width: number;
  data: TableData[];
  columns: Array<ColumnDef<TableData>>;
}

export function Table<TableData>({ data, columns, ...otherProps }: TableProps<TableData>) {
  const table = useReactTable({
    data,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return <VirtualizedTable {...otherProps} table={table} />;
}
