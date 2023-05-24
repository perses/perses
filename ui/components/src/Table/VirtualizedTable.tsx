// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
import { TableProps } from './model/table-model';
import { useVirtualizedTableKeyboardNav } from './hooks/useVirtualizedTableKeyboardNav';

type TableCellPosition = {
  row: number;
  column: number;
};

export type VirtualizedTableProps<TableData extends Record<string, unknown>> = Required<
  Pick<TableProps<TableData>, 'height' | 'width' | 'density'>
> & {
  onRowClick: (id: string) => void;
  rows: Array<Row<TableData>>;
  columns: Array<Column<TableData, unknown>>;
  headers: Array<HeaderGroup<TableData>>;
};

// Separating out the virtualized table because we may want a paginated table
// in the future that does not need virtualization, and we'd likely lay them
// out differently.
export function VirtualizedTable<TableData extends Record<string, unknown>>({
  width,
  height,
  density,
  onRowClick,
  rows,
  columns,
  headers,
}: VirtualizedTableProps<TableData>) {
  const virtuosoRef = useRef<TableVirtuosoHandle>(null);

  // Use a ref for these values because they are only needed for keyboard
  // focus interactions and setting them on state will lead to a significant
  // amount of unnecessary re-renders.
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

  const getFocusState = (cellPosition: TableCellPosition): TableCellProps['focusState'] => {
    if (cellPosition.row === keyboardNav.activeCell.row && cellPosition.column === keyboardNav.activeCell.column) {
      return keyboardNav.isActive ? 'trigger-focus' : 'focus-next';
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
                          onFocusTrigger={() => keyboardNav.onCellFocus(position)}
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
                    onFocusTrigger={() => keyboardNav.onCellFocus(position)}
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
