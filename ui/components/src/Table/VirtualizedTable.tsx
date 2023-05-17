import { Table as TSTable, flexRender } from '@tanstack/react-table';
import { Box, Typography } from '@mui/material';
import { TableVirtuoso, TableComponents, TableVirtuosoHandle } from 'react-virtuoso';
import { useRef, useState } from 'react';
import { combineSx } from '../utils';
import { TableProps } from './Table';
import { TableRow } from './TableRow';
import { TableBody } from './TableBody';
import { InnerTable } from './InnerTable';
import { TableHead } from './TableHead';
import { TableCell } from './TableCell';
import { VirtualizedTableContainer } from './VirtualizedTableContainer';
import { TableDensity } from './table-model';

type TableCellPosition = {
  row: number;
  column: number;
};

// TODO: extract and reuse props
export interface VirtualizedTableProps<TableData> {
  height: number;
  width: number;
  table: TSTable<TableData>;
  density: TableDensity;
}

const DEFAULT_ACTIVE_CELL: TableCellPosition = {
  row: 0,
  column: 0,
};

// Separating out the virtualized table because we may want a paginated table
// in the future that does not need virtualization, and we'd likely lay them
// out differently.
export function VirtualizedTable<TableData>({ width, height, table, density }: VirtualizedTableProps<TableData>) {
  const virtuosoRef = useRef<TableVirtuosoHandle>(null);

  const [activeCell, setActiveCell] = useState<TableCellPosition>(DEFAULT_ACTIVE_CELL);

  const rows = table.getRowModel().rows;
  const columns = table.getAllFlatColumns();

  function isActiveCell(cellPosition: TableCellPosition) {
    // console.log(`isActive: ${rowIndex}, ${columnIndex}`);
    return cellPosition.row === activeCell.row && cellPosition.column === activeCell.column;
  }

  const handleCellOnClick = (cellPosition: TableCellPosition) => {
    if (cellPosition.column === activeCell.column && cellPosition.row === activeCell.row) {
      return;
    }
    setActiveCell(cellPosition);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTableElement> = (e) => {
    const key = e.key;
    console.log(key);

    setActiveCell((curActiveCell) => {
      let nextRow: number = curActiveCell.row;
      let nextColumn: number = curActiveCell.column;

      if (key === 'ArrowRight' && nextColumn < columns.length - 1) {
        nextColumn += 1;
      } else if (key === 'ArrowLeft' && nextColumn > 0) {
        nextColumn -= 1;
      } else if (key === 'ArrowDown' && nextRow < rows.length - 1) {
        e.preventDefault();
        nextRow += 1;
        virtuosoRef.current?.scrollToIndex({
          index: nextRow - 1,
          align: 'end',
        });
      } else if (key === 'ArrowUp' && nextRow > 0) {
        e.preventDefault();
        nextRow -= 1;
        virtuosoRef.current?.scrollToIndex({
          index: nextRow - 1,
          align: 'end',
        });
      }

      return { column: nextColumn, row: nextRow };
    });
  };
  console.log(activeCell);

  const VirtuosoTableComponents: TableComponents<TableData> = {
    Scroller: VirtualizedTableContainer,
    Table: (props) => {
      return <InnerTable {...props} width={width} density={density} onKeyDown={handleKeyDown} />;
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
        ref={virtuosoRef}
        totalCount={rows.length}
        components={VirtuosoTableComponents}
        fixedHeaderContent={() => {
          return (
            <>
              {table.getHeaderGroups().map((headerGroup) => {
                return (
                  <TableRow key={headerGroup.id} density={density}>
                    {headerGroup.headers.map((header, i) => {
                      const column = header.column;

                      return (
                        <TableCell
                          key={header.id}
                          width={column.getSize() || 'auto'}
                          variant="head"
                          density={density}
                          isActive={isActiveCell({ row: 0, column: i })}
                          onClick={() => handleCellOnClick({ row: 0, column: i })}
                        >
                          {flexRender(column.columnDef.header, header.getContext())}
                        </TableCell>
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
              {row.getVisibleCells().map((cell, i) => {
                return (
                  <TableCell
                    key={cell.id}
                    sx={{ width: cell.column.getSize() || 'auto' }}
                    density={density}
                    // Add 1 to the row index because the header is row 0
                    isActive={isActiveCell({ row: index + 1, column: i })}
                    onFocus={() => handleCellOnClick({ row: index + 1, column: i })}
                  >
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
