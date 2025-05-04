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
import { Box, TablePagination, TableRow as MuiTableRow } from '@mui/material';
import { TableVirtuoso, TableComponents, TableVirtuosoHandle, TableVirtuosoProps } from 'react-virtuoso';
import { useRef, useMemo, ReactElement } from 'react';
import { TableRow } from './TableRow';
import { TableBody } from './TableBody';
import { InnerTable } from './InnerTable';
import { TableHead } from './TableHead';
import { TableHeaderCell } from './TableHeaderCell';
import { TableCell, TableCellProps } from './TableCell';
import { VirtualizedTableContainer } from './VirtualizedTableContainer';
import { TableCellConfigs, TableProps, TableRowEventOpts } from './model/table-model';
import { useVirtualizedTableKeyboardNav } from './hooks/useVirtualizedTableKeyboardNav';
import { TableFoot } from './TableFoot';
import { replaceCellVariables } from './services/url-template.service';

type TableCellPosition = {
  row: number;
  column: number;
};

export type VirtualizedTableProps<TableData> = Required<
  Pick<TableProps<TableData>, 'height' | 'width' | 'density' | 'defaultColumnWidth' | 'defaultColumnHeight'>
> &
  Pick<TableProps<TableData>, 'onRowMouseOver' | 'onRowMouseOut' | 'pagination' | 'onPaginationChange'> & {
    onRowClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => void;
    rows: Array<Row<TableData>>;
    columns: Array<Column<TableData, unknown>>;
    headers: Array<HeaderGroup<TableData>>;
    cellConfigs?: TableCellConfigs;
    rowCount: number;
  };

// Separating out the virtualized table because we may want a paginated table
// in the future that does not need virtualization, and we'd likely lay them
// out differently.
export function VirtualizedTable<TableData>({
  width,
  height,
  density,
  defaultColumnWidth,
  defaultColumnHeight,
  onRowClick,
  onRowMouseOver,
  onRowMouseOut,
  rows,
  columns,
  headers,
  cellConfigs,
  pagination,
  onPaginationChange,
  rowCount,
}: VirtualizedTableProps<TableData>): ReactElement {
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
      Table: (props): ReactElement => {
        return <InnerTable {...props} width={width} density={density} onKeyDown={keyboardNav.onTableKeyDown} />;
      },
      TableHead,
      TableFoot,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      TableRow: ({ item, ...props }): ReactElement | null => {
        const index = props['data-index'];
        const row = rows[index];
        if (!row) {
          return null;
        }

        const rowEventOpts: TableRowEventOpts = { id: row.id, index: row.index };

        return (
          <TableRow
            {...props}
            onClick={(e) => onRowClick(e, row.id)}
            density={density}
            onMouseOver={(e) => {
              onRowMouseOver?.(e, rowEventOpts);
            }}
            onMouseOut={(e) => {
              onRowMouseOut?.(e, rowEventOpts);
            }}
          />
        );
      },
      TableBody,
    };
  }, [density, keyboardNav.onTableKeyDown, onRowClick, onRowMouseOut, onRowMouseOver, rows, width]);

  const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number): void => {
    if (!pagination || !onPaginationChange) return;
    onPaginationChange({ ...pagination, pageIndex: newPage });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (!pagination || !onPaginationChange) return;
    onPaginationChange({ pageIndex: 0, pageSize: parseInt(event.target.value, 10) });
  };

  return (
    <Box style={{ width, height }}>
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
                    {headerGroup.headers.map((header, i, headers) => {
                      const column = header.column;
                      const position: TableCellPosition = {
                        row: 0,
                        column: i,
                      };

                      const isSorted = column.getIsSorted();
                      const nextSorting = column.getNextSortingOrder();

                      return (
                        <TableHeaderCell
                          key={header.id}
                          onSort={column.getCanSort() ? column.getToggleSortingHandler() : undefined}
                          sortDirection={typeof isSorted === 'string' ? isSorted : undefined}
                          nextSortDirection={typeof nextSorting === 'string' ? nextSorting : undefined}
                          width={column.getSize() || defaultColumnWidth}
                          defaultColumnHeight={defaultColumnHeight}
                          align={column.columnDef.meta?.align}
                          variant="head"
                          density={density}
                          description={column.columnDef.meta?.headerDescription}
                          focusState={getFocusState(position)}
                          onFocusTrigger={() => keyboardNav.onCellFocus(position)}
                          isFirstColumn={i === 0}
                          isLastColumn={i === headers.length - 1}
                        >
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
        fixedFooterContent={
          pagination
            ? (): ReactElement => (
                <MuiTableRow sx={{ backgroundColor: (theme) => theme.palette.background.default }}>
                  <TablePagination
                    colSpan={columns.length}
                    count={rowCount}
                    page={pagination.pageIndex}
                    rowsPerPage={pagination.pageSize}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </MuiTableRow>
              )
            : undefined
        }
        itemContent={(index) => {
          const row = rows[index];
          if (!row) {
            return null;
          }

          return (
            <>
              {row.getVisibleCells().map((cell, i, cells) => {
                const position: TableCellPosition = {
                  // Add 1 to the row index because the header is row 0
                  row: index + 1,
                  column: i,
                };

                const cellContext = cell.getContext();
                const cellConfig = cellConfigs?.[cellContext.cell.id];

                const cellRenderFn = cell.column.columnDef.cell;
                const cellContent = typeof cellRenderFn === 'function' ? cellRenderFn(cellContext) : null;

                const cellURLTemplate = cell.column.columnDef.meta?.linkConfig?.urlTemplate;
                const openInNewTab = cell.column.columnDef.meta?.linkConfig?.openInNewTab;

                const link = replaceCellVariables(cellURLTemplate, cell.column.id, cellContent, row.original);

                const cellDescriptionDef = cell.column.columnDef.meta?.cellDescription;
                let description: string | undefined = undefined;
                if (typeof cellDescriptionDef === 'function') {
                  // If the cell description is a function, set the value using
                  // the function.
                  description = cellDescriptionDef(cellContext);
                } else if (cellDescriptionDef && typeof cellContent === 'string') {
                  // If the cell description is `true` AND the cell content is
                  // a string (and thus viable as a `title` attribute), use the
                  // cell content.
                  description = cellContent;
                }

                return (
                  <TableCell
                    key={cell.id}
                    data-testid={cell.id}
                    title={description || cellConfig?.text || cellContent}
                    width={cell.column.getSize() || defaultColumnWidth}
                    defaultColumnHeight={defaultColumnHeight}
                    align={cell.column.columnDef.meta?.align}
                    density={density}
                    focusState={getFocusState(position)}
                    onFocusTrigger={() => keyboardNav.onCellFocus(position)}
                    isFirstColumn={i === 0}
                    isLastColumn={i === cells.length - 1}
                    description={description}
                    color={cellConfig?.textColor ?? undefined}
                    backgroundColor={cellConfig?.backgroundColor ?? undefined}
                    link={link}
                    openInNewTab={openInNewTab}
                  >
                    {cellConfig?.text || cellContent}
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
