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
import { TableDensity } from './layoutUtils';

// TODO: extract and reuse props
export interface VirtualizedTableProps<TableData> {
  height: number;
  width: number;
  table: TSTable<TableData>;
  density: TableDensity;
  checkboxSelection?: boolean;
}

// Separating out the virtualized table because we may want a paginated table
// in the future that does not need virtualization, and we'd likely lay them
// out differently.
export function VirtualizedTable<TableData>({
  width,
  height,
  table,
  density,
  checkboxSelection,
}: VirtualizedTableProps<TableData>) {
  const rows = table.getRowModel().rows;

  const VirtuosoTableComponents: TableComponents<TableData> = {
    Scroller: VirtualizedTableContainer,
    Table: (props) => {
      return <InnerTable {...props} width={table.getCenterTotalSize()} density={density} />;
    },
    TableHead,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TableRow: ({ item, ...props }) => {
      return <TableRow {...props} density={density} />;
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
                  <TableRow key={headerGroup.id} density={density}>
                    {headerGroup.headers.map((header) => {
                      const column = header.column;

                      return (
                        <TableHeaderCell key={header.id} sx={{ width: column.getSize() }} density={density}>
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
                  <TableCell key={cell.id} sx={{ width: cell.column.getSize() }} density={density}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
