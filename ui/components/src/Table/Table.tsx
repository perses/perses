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

export type TableDensity = 'compact' | 'standard';

export interface TableProps<TableData> {
  height: number;
  width: number;
  data: TableData[];
  columns: Array<ColumnDef<TableData>>;
  density?: TableDensity;
}

export function Table<TableData>({ data, columns, density = 'standard', ...otherProps }: TableProps<TableData>) {
  const table = useReactTable({
    data,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return <VirtualizedTable {...otherProps} table={table} density={density} />;
}
