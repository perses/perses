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
}

export function Table<TableData>({ data, ...otherProps }: TableProps<TableData>) {
  const DEFAULT_COLUMNS: Array<ColumnDef<TableData>> = [
    {
      accessorKey: 'name',
      header: 'Name',
      size: 200,
    },
    {
      accessorKey: 'value',
      header: 'Value',
    },
  ];
  const table = useReactTable({
    data,
    columns: DEFAULT_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });

  return <VirtualizedTable {...otherProps} table={table} />;
}
