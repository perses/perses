import { Column, HeaderGroup, Row, flexRender } from '@tanstack/react-table';
import { Box } from '@mui/material';
import { TableVirtuoso, TableComponents, TableVirtuosoHandle, TableVirtuosoProps } from 'react-virtuoso';
import { useRef, useMemo } from 'react';
import { TableRow } from './TableRow';
import { TableBody } from './TableBody';
import { InnerTable } from './InnerTable';
import { TableHead } from './TableHead';
import { TableCell, TableCellProps } from './TableCell';
import { VirtualizedTableContainer } from './VirtualizedTableContainer';
import { TableDensity } from './table-model';
import { useVirtualizedTableKeyboardNav } from './hooks/useVirtualizedTableKeyboardNav';

type TableCellPosition = {
  row: number;
  column: number;
};

// TODO: extract and reuse props
export interface VirtualizedTableProps<TableData> {
  height: number;
  width: number;
  density: TableDensity;
  onRowClick: (id: string) => void;
  rows: Array<Row<TableData>>;
  columns: Array<Column<TableData, unknown>>;
  headers: Array<HeaderGroup<TableData>>;
}

// Separating out the virtualized table because we may want a paginated table
// in the future that does not need virtualization, and we'd likely lay them
// out differently.
export function VirtualizedTable<TableData>({
  width,
  height,
  density,
  onRowClick,
  rows,
  columns,
  headers,
}: VirtualizedTableProps<TableData>) {
  const virtuosoRef = useRef<TableVirtuosoHandle>(null);
  const visibleRange = useRef({
    startIndex: 0,
    endIndex: 0,
  });

  const setVisibleRange: TableVirtuosoProps<TableData, unknown>['rangeChanged'] = (newVisibleRange) => {
    visibleRange.current = newVisibleRange;
  };

  const keyboardNav = useVirtualizedTableKeyboardNav({
    visibleRange: visibleRange,
    virtualTable: virtuosoRef,

    // We add 1 here for the header.
    maxRows: rows.length + 1,
    maxColumns: columns.length,
  });

  const { activeCell, isActive } = keyboardNav;

  const getFocusState = (cellPosition: TableCellPosition): TableCellProps['focusState'] => {
    if (cellPosition.row === activeCell.row && cellPosition.column === activeCell.column) {
      return isActive ? 'trigger-focus' : 'focus-next';
    }

    return 'none';
  };

  const VirtuosoTableComponents: TableComponents<TableData> = useMemo(() => {
    return {
      Scroller: VirtualizedTableContainer,
      Table: (props) => {
        return <InnerTable {...props} width={width} density={density} onKeyDown={keyboardNav.onTableKeyDown} />;
      },
      TableHead,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      TableRow: ({ item, ...props }) => {
        const index = props['data-index'];
        const row = rows[index];
        if (!row) {
          return null;
        }

        return <TableRow {...props} onClick={() => onRowClick(row.id)} density={density} />;
      },
      TableBody,
    };
  }, [density, keyboardNav.onTableKeyDown, onRowClick, rows, width]);

  return (
    <Box sx={{ width, height }}>
      <TableVirtuoso
        ref={virtuosoRef}
        totalCount={rows.length}
        components={VirtuosoTableComponents}
        // Note: this value is impacted by overscan. See this issue if overscan
        // is added.
        // https://github.com/petyosi/react-virtuoso/issues/118#issuecomment-642156138
        rangeChanged={setVisibleRange}
        fixedHeaderContent={() => {
          return (
            <>
              {headers.map((headerGroup) => {
                return (
                  <TableRow key={headerGroup.id} density={density}>
                    {headerGroup.headers.map((header, i) => {
                      const column = header.column;
                      const position: TableCellPosition = {
                        row: 0,
                        column: i,
                      };

                      return (
                        <TableCell
                          key={header.id}
                          width={column.getSize() || 'auto'}
                          variant="head"
                          density={density}
                          focusState={getFocusState(position)}
                          onFocus={() => keyboardNav.onCellFocus(position)}
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
                const position: TableCellPosition = {
                  // Add 1 to the row index because the header is row 0
                  row: index + 1,
                  column: i,
                };

                return (
                  <TableCell
                    key={cell.id}
                    sx={{ width: cell.column.getSize() || 'auto' }}
                    density={density}
                    focusState={getFocusState(position)}
                    onFocus={() => keyboardNav.onCellFocus(position)}
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
