import { Table as TSTable } from '@tanstack/react-table';
import { Box } from '@mui/material';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { TableProps } from './Table';

export interface VirtualizedTableProps<TableData> {
  height: number;
  width: number;
  table: TSTable<TableData>;
}

// Separating out the virtualized table because we may want a paginated table
// in the future that does not need virtualization, and we'd likely lay them
// out differently.
export function VirtualizedTable<TableData>({ width, height, table }: VirtualizedTableProps<TableData>) {
  const rows = table.getRowModel().rows;
  console.log(rows);

  return <Box sx={{ width, height }}>table time</Box>;
}
