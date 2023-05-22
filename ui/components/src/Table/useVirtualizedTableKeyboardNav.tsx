import { useCallback, useState } from 'react';
import { TableVirtuosoHandle } from 'react-virtuoso';
import { useTableKeyboardNav, UseTableKeyboardNavProps } from './useTableKeyboardNav';

interface UseVirtualizedTableKeyboardNavProps extends Omit<UseTableKeyboardNavProps, 'onActiveCellChange'> {
  visibleRange: React.MutableRefObject<{
    startIndex: number;
    endIndex: number;
  }>;
  virtualTable: React.RefObject<TableVirtuosoHandle>;
  maxRows: number;
  maxColumns: number;
}

/**
 * Hook for managing keyboard navigation when using a virtualized table.
 */
export function useVirtualizedTableKeyboardNav({
  visibleRange,
  virtualTable,
  maxRows,
  maxColumns,
}: UseVirtualizedTableKeyboardNavProps) {
  const baseKeyboard = useTableKeyboardNav({
    maxRows,
    maxColumns,
    onActiveCellChange: (e, currentPosition, defaultNewPosition) => {
      const key = e.key;

      const defaultValueChanged =
        defaultNewPosition &&
        (currentPosition.column !== defaultNewPosition.column || currentPosition.row !== defaultNewPosition.row);
      const nextRow = defaultNewPosition?.row ?? currentPosition.row;

      if (key === 'ArrowDown' && defaultValueChanged) {
        // Use default cell position. Shift the virtual table scroll position
        // when needed to make the active cell visible.
        if (nextRow - 1 < visibleRange.current.startIndex || nextRow - 1 > visibleRange.current.endIndex) {
          console.log('scroll to index');
          virtualTable.current?.scrollToIndex({
            index: nextRow - 1,
            align: 'end',
          });
        }
      } else if (key === 'ArrowUp' && defaultValueChanged) {
        // Use default cell position. Shift the virtual table scroll position
        // when needed to make the active cell visible.
        if (nextRow - 1 < visibleRange.current.startIndex || nextRow - 1 > visibleRange.current.endIndex) {
          virtualTable.current?.scrollToIndex({
            index: nextRow - 1,
            align: 'start',
          });
        }
      } else if (defaultValueChanged && (key === 'Home' || key === 'End')) {
        // Use default cell position. Shift the virtual table scroll position
        // when needed to make the active cell visible.
        virtualTable.current?.scrollToIndex({
          index: Math.max(nextRow - 1, 0),
          align: 'start',
        });
      } else if (key === 'PageDown') {
        // Full handling of logic for `PageDown` because there is no default.
        e.preventDefault();

        let nextRow = currentPosition.row;
        // Add 1 to account for header

        nextRow = Math.min(maxRows - 1, visibleRange.current.endIndex + 1);

        virtualTable.current?.scrollToIndex({
          index: nextRow - 1,
          align: 'start',
        });

        return {
          row: nextRow,
          column: currentPosition.column,
        };
      } else if (key === 'PageUp') {
        // Full handling of logic for `PageUp` because there is no default.
        let nextRow = currentPosition.row;
        // Minus 1 to account for header
        nextRow = Math.max(0, visibleRange.current.startIndex - 1);
        virtualTable.current?.scrollToIndex({
          index: nextRow - 1,
          align: 'end',
        });

        return {
          row: nextRow,
          column: currentPosition.column,
        };
      }

      return defaultNewPosition;
    },
  });

  return baseKeyboard;
}
