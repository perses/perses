import { Table as TSTable, flexRender } from '@tanstack/react-table';
import { Box, Typography } from '@mui/material';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { TableProps } from './Table';
import { TableRow } from './TableRow';
import { TableBody } from './TableBody';
import { InnerTable } from './InnerTable';
import { TableHead } from './TableHead';
import { TableHeaderCell } from './TableHeaderCell';
import { TableCell } from './TableCell';
import { VirtualizedTableContainer } from './VirtualizedTableContainer';

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

  const VirtuosoTableComponents: TableComponents<TableData> = {
    Scroller: VirtualizedTableContainer,
    Table: (props) => {
      return <InnerTable {...props} width={table.getCenterTotalSize()} />;
    },
    TableHead,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TableRow: ({ item, ...props }) => {
      return <TableRow {...props} />;
    },
    TableBody,
  };

  return (
    <Box sx={{ width, height }}>
      <TableVirtuoso
        totalCount={rows.length}
        components={VirtuosoTableComponents}
        fixedHeaderContent={() => {
          return (
            <>
              {table.getHeaderGroups().map((headerGroup) => {
                return (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const column = header.column;

                      return (
                        <TableHeaderCell key={header.id} sx={{ width: column.getSize() }}>
                          {flexRender(column.columnDef.header, header.getContext())}
                        </TableHeaderCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </>
          );
        }}
        itemContent={(index) => {
          const row = rows[index];
          if (!row) {
            return null;
          }

          return (
            <>
              {row.getVisibleCells().map((cell) => {
                return (
                  <TableCell key={cell.id} sx={{ width: cell.column.getSize() }}>
                    <Typography noWrap>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Typography>
                  </TableCell>
                );
              })}
            </>
          );
        }}
      />
    </Box>
  );
}
