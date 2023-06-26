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
