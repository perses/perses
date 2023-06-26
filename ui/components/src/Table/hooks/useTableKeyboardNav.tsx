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

import { useCallback, useState } from 'react';

export interface UseTableKeyboardNavProps {
  maxRows: number;
  maxColumns: number;

  /**
   * Function used to modify the active table cell based on the keyboard event,
   * the current position, and the default recommended next position (this value
   * will be `undefined` in cases where there is no default handler like `PageUp`
   * and `PageDown`). This can be used to modify the next position that will be
   * used and/or to handle side effects related to the new position (e.g.
   * pagination, scrolling the active cell into view).
   */
  onActiveCellChange?: (
    e: React.KeyboardEvent<HTMLTableElement>,
    currentActiveCell: TableCellPosition,
    defaultNextActiveCell: TableCellPosition | undefined
  ) => TableCellPosition | undefined;
}

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

/**
 * Hook for managing keyboard navigation for table components. It is intended
 * to be wrapped by implementation-specific tables to account for differences
 * like pagination, infinite scroll, and virtualization. See `useVirtualizedKeyboardNav`
 * for an example.
 */
export function useTableKeyboardNav({ maxRows, maxColumns, onActiveCellChange }: UseTableKeyboardNavProps) {
  const [activeCell, setActiveCell] = useState<TableCellPosition>(DEFAULT_ACTIVE_CELL);
  const [isActive, setIsActive] = useState(false);

  const handleCellFocus = (cellPosition: TableCellPosition) => {
    if (cellPosition.column === activeCell.column && cellPosition.row === activeCell.row && isActive) {
      return;
    }
    setIsActive(true);
    setActiveCell(cellPosition);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTableElement> = useCallback(
    (e) => {
      // Including some of the basic a11y keyboard interaction patterns from:
      // https://www.w3.org/WAI/ARIA/apg/patterns/grid/
      // TODO: add other keyboard combos.
      const key = e.key;

      if (isArrowKey(key) || key === 'Home' || key === 'End' || key === 'PageDown' || key === 'PageUp') {
        setActiveCell((curActiveCell) => {
          let nextRow: number = curActiveCell.row;
          let nextColumn: number = curActiveCell.column;

          if (key === 'ArrowRight' && nextColumn < maxColumns - 1) {
            e.preventDefault();
            nextColumn += 1;
          } else if (key === 'ArrowLeft' && nextColumn > 0) {
            e.preventDefault();
            nextColumn -= 1;
          } else if (key === 'ArrowDown' && nextRow < maxRows - 1) {
            e.preventDefault();
            nextRow += 1;
          } else if (key === 'ArrowUp' && nextRow > 0) {
            e.preventDefault();
            nextRow -= 1;
          } else if (key === 'Home') {
            e.preventDefault();
            nextRow = 0;
            nextColumn = 0;
          } else if (key === 'End') {
            e.preventDefault();
            nextRow = maxRows - 1;
            nextColumn = maxColumns - 1;
          }

          const defaultNewPosition = { column: nextColumn, row: nextRow };

          const newPosition = onActiveCellChange?.(e, curActiveCell, defaultNewPosition) || defaultNewPosition;

          if (newPosition.row === curActiveCell.row && newPosition.column === curActiveCell.column) {
            // Return original to avoid creating a new object if nothing
            // changed.
            return curActiveCell;
          }

          return newPosition;
        });
      }
    },
    [maxColumns, maxRows, onActiveCellChange]
  );

  return {
    activeCell,
    isActive,
    onTableKeyDown: handleKeyDown,
    onCellFocus: handleCellFocus,
  };
}
