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

import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps, Box, useTheme } from '@mui/material';
import { useEffect, useRef } from 'react';
import { TableDensity, getTableCellLayout } from './model/table-model';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme }) => ({
  padding: 0,
  backgroundColor: 'inherit',

  '&.MuiTableCell-head': {
    // Important to avoid scrolling behind the header showing through.
    backgroundColor: theme.palette.background.default,
  },
  '&:focus-visible': {
    outline: `solid 1px ${theme.palette.primary.main}`,
    // Move inward a little to avoid getting cut off when focusing on items
    // at the edge of the table.
    outlineOffset: '-1px',
    borderRadius: 0,
  },
}));

export interface TableCellProps extends Omit<MuiTableCellProps, 'tabIndex'> {
  density: TableDensity;

  /**
   * How the cell should behave related to focus.
   * - `trigger-focus`: the cell should be auto-focused when it renders.
   * - `focus-next`: the cell should have tabindex="0", so that it will be
   *   focused the next time someone tabs with a keyboard.
   * - `none`: the cell should have tabindex="-1", so it is not focused by
   *   keyboard interactions at this time.
   */
  focusState?: 'trigger-focus' | 'focus-next' | 'none';
  onFocusTrigger?: (e: React.MouseEvent<HTMLTableCellElement> | React.KeyboardEvent<HTMLTableCellElement>) => void;
}

export function TableCell({
  children,
  density,
  variant,
  width,
  focusState = 'none',
  onFocusTrigger,
  ...otherProps
}: TableCellProps) {
  const theme = useTheme();

  const elRef = useRef<HTMLTableCellElement>();

  const isHeader = variant === 'head';

  useEffect(() => {
    if (focusState === 'trigger-focus' && elRef.current) {
      elRef.current.focus();
    }
  }, [focusState]);

  const handleFocus: React.FocusEventHandler<HTMLTableCellElement> = (e) => {
    // From https://zellwk.com/blog/keyboard-focusable-elements/
    const nestedFocusTarget = e.currentTarget?.querySelector<HTMLElement>(
      'a[href], button, input, textarea, select, details'
    );
    if (nestedFocusTarget) {
      // If the cell has a focusable child, focus it instead. Mostly used for
      // checkbox cells, but could have other uses.
      nestedFocusTarget.focus();
    }
  };

  const handleInteractionFocusTrigger: TableCellProps['onFocusTrigger'] = (e) => {
    // We use `onClick` and `onKeyUp` events instead of `onFocus` because of
    // some ordering issues with when the browser calls events and how this
    // plays with the triggering of focus with keyboard interactions.
    // These report that a focus event happened, so we can adjust the current
    // tabindex and focuses to the right cell.
    onFocusTrigger?.(e);
  };

  return (
    <StyledMuiTableCell
      {...otherProps}
      // Modify the tab index based on the currently focused cell. It's important
      // to avoid having tabindex 0 on everything because it essentially traps
      // a keyboard user in the table until they hit "tab" for every single
      // cell.
      tabIndex={focusState !== 'none' ? 0 : -1}
      onFocus={handleFocus}
      onClick={handleInteractionFocusTrigger}
      onKeyUp={handleInteractionFocusTrigger}
      sx={{
        width: width,
        borderBottom: isHeader
          ? (theme) => `solid 1px ${theme.palette.grey[100]}`
          : `solid 1px ${theme.palette.grey[50]}`,
      }}
      ref={elRef}
    >
      <Box
        sx={{
          ...getTableCellLayout(theme, density),
          position: 'relative',

          // Text truncation. Currently enforced on all cells. We may control
          // this with a prop on column config in the future.
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {children}
      </Box>
    </StyledMuiTableCell>
  );
}
