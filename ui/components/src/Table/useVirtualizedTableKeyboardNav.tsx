import { useCallback, useState } from 'react';
import { TableVirtuosoHandle } from 'react-virtuoso';

type UseTableKeyboardNavProps = {
  visibleRange: React.MutableRefObject<{
    startIndex: number;
    endIndex: number;
  }>;
  virtualTable: React.RefObject<TableVirtuosoHandle>;
  maxRows: number;
  maxColumns: number;
};

type TableCellPosition = {
  row: number;
  column: number;
};

const DEFAULT_ACTIVE_CELL: TableCellPosition = {
  row: 0,
  column: 0,
};

const ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];

function isArrowKey(key: string) {
  return ARROW_KEYS.includes(key);
}

export function useVirtualizedTableKeyboardNav({
  visibleRange,
  virtualTable,
  maxRows,
  maxColumns,
}: UseTableKeyboardNavProps) {
  console.log('virt table hook');
  const [activeCell, setActiveCell] = useState<TableCellPosition>(DEFAULT_ACTIVE_CELL);
  const [isActive, setIsActive] = useState(false);

  const handleCellFocus = (cellPosition: TableCellPosition) => {
    if (cellPosition.column === activeCell.column && cellPosition.row === activeCell.row && isActive) {
      return;
    }
    setIsActive(true);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTableElement> = useCallback(
    (e) => {
      console.log('__keydown__');
      console.log(visibleRange.current);
      // Including some of the basic a11y keyboard interaction patterns from:
      // https://www.w3.org/WAI/ARIA/apg/patterns/grid/
      // TODO: add other keyboard combos.
      const key = e.key;

      if (isArrowKey(key) || key === 'Home' || key === 'End' || key === 'PageDown' || key === 'PageUp') {
        setActiveCell((curActiveCell) => {
          let nextRow: number = curActiveCell.row;
          let nextColumn: number = curActiveCell.column;

          if (key === 'ArrowRight' && nextColumn < maxColumns - 1) {
            nextColumn += 1;
          } else if (key === 'ArrowLeft' && nextColumn > 0) {
            nextColumn -= 1;
          } else if (key === 'ArrowDown' && nextRow < maxRows - 1) {
            e.preventDefault();
            nextRow += 1;

            // TODO: Only do when needed
            if (nextRow - 1 < visibleRange.current.startIndex || nextRow - 1 > visibleRange.current.endIndex) {
              virtualTable.current?.scrollToIndex({
                index: nextRow - 1,
                align: 'end',
              });
            }
          } else if (key === 'ArrowUp' && nextRow > 0) {
            e.preventDefault();
            nextRow -= 1;

            // TODO: Only do when needed
            if (nextRow - 1 < visibleRange.current.startIndex || nextRow - 1 > visibleRange.current.endIndex) {
              virtualTable.current?.scrollToIndex({
                index: nextRow - 1,
                align: 'start',
              });
            }
          } else if (key === 'Home') {
            nextRow = 0;
            nextColumn = 0;
            virtualTable.current?.scrollToIndex({
              index: nextRow - 1,
              align: 'start',
            });
          } else if (key === 'End') {
            nextRow = maxRows - 1;
            nextColumn = maxColumns - 1;
            virtualTable.current?.scrollToIndex({
              index: nextRow - 1,
              align: 'start',
            });
          } else if (key === 'PageDown') {
            console.log('page down');
            e.preventDefault();
            // Add 1 to account for header
            // console.log(maxRows - 1, visibleRange.endIndex + 1);
            nextRow = Math.min(maxRows - 1, visibleRange.current.endIndex + 1);
            // console.log(nextRow);
            virtualTable.current?.scrollToIndex({
              index: nextRow - 1,
              align: 'start',
            });
          } else if (key === 'PageUp') {
            console.log('page up');
            e.preventDefault();
            // Minus 1 to account for header
            nextRow = Math.max(0, visibleRange.current.startIndex - 1);
            virtualTable.current?.scrollToIndex({
              index: nextRow - 1,
              align: 'end',
            });
          }

          if (nextRow === curActiveCell.row && nextColumn === curActiveCell.column) {
            // Return original to avoid creating a new object if nothing
            // changed.
            return curActiveCell;
          }

          return { column: nextColumn, row: nextRow };
        });
      }
    },
    [maxColumns, maxRows, virtualTable, visibleRange]
  );

  return {
    activeCell,
    isActive,
    onTableKeyDown: handleKeyDown,
    onCellFocus: handleCellFocus,
  };
}
