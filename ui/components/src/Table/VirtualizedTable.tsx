import { Table as TSTable, flexRender } from '@tanstack/react-table';
import {
  Table as MuiTable,
  TableRow as MuiTableRow,
  TableCell as MuiTableCell,
  TableSortLabel,
  Paper,
  Checkbox,
  Box,
  Typography,
  TextField,
  styled,
} from '@mui/material';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { forwardRef } from 'react';
import { TableProps } from './Table';
import { TableRow } from './TableRow';
import { TableBody } from './TableBody';
import { InnerTable } from './InnerTable';
import { TableHead } from './TableHead';
import { VirtualizedTableContainer } from './VirtualizedTableContainer';

export interface VirtualizedTableProps<TableData> {
  height: number;
  width: number;
  table: TSTable<TableData>;
}

const StyledMuiTableRow = styled(MuiTableRow)(({ theme }) => ({}));
export const StyledMuiTableCell = styled(MuiTableCell)(({ theme }) => ({}));

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
                  <StyledMuiTableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const column = header.column;

                      return (
                        <StyledMuiTableCell key={header.id} sx={{ width: column.getSize() }}>
                          <Typography noWrap>{flexRender(column.columnDef.header, header.getContext())}</Typography>
                        </StyledMuiTableCell>
                      );
                    })}
                  </StyledMuiTableRow>
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
                  <StyledMuiTableCell key={cell.id} sx={{ width: cell.column.getSize() }}>
                    <Typography noWrap>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Typography>
                  </StyledMuiTableCell>
                );
              })}
            </>
          );
        }}
      />
    </Box>
  );
}
