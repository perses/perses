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
import { ReactElement, useEffect, useRef } from 'react';
import { TableCellAlignment, TableDensity, getTableCellLayout } from './model/table-model';

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

export interface TableCellProps extends Omit<MuiTableCellProps, 'tabIndex' | 'align'> {
  density: TableDensity;
  defaultColumnHeight?: 'auto' | number;

  // These values are used to adjust the spacing for the first/last columns.
  isLastColumn: boolean;
  isFirstColumn: boolean;

  align?: TableCellAlignment;

  /**
   * Additional information to be displayed when hovering over the cell. This
   * may be the full cell value (e.g. to enable the user to see the full value
   * if it is ellipsized to fit into the space) or some other descriptive text
   * that is useful for the user.
   *
   * The hover behavior is currently managed with the `title` attribute, but this
   * may be changed to a tooltip in the future.
   */
  description?: string;

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
  color?: string;
  backgroundColor?: string;
}

export function TableCell({
  children,
  density,
  variant,
  width,
  defaultColumnHeight,
  focusState = 'none',
  onFocusTrigger,
  isFirstColumn,
  isLastColumn,
  description,
  align,
  color,
  backgroundColor,
  ...otherProps
}: TableCellProps): ReactElement {
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
      'a[href], button, input, textarea, select, details,[role="button"]'
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
      style={{ width: width }}
      sx={{
        position: 'relative',
        borderBottom: isHeader ? `solid 1px ${theme.palette.grey[100]}` : `solid 1px ${theme.palette.grey[50]}`,
        '&:hover #original-cell': {
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          width: 'fit-content',
          minWidth: '100%',
          whiteSpace: 'nowrap',
          overflow: 'visible',
          backgroundColor: `${backgroundColor ?? theme.palette.background.default} !important`,
          outline: `solid 1px ${theme.palette.info.main}`,
          outlineOffset: '-1px',
        },
      }}
      ref={elRef}
    >
      <Box
        id="original-cell"
        sx={{
          ...getTableCellLayout(theme, density, { isHeader, isLastColumn, isFirstColumn, defaultColumnHeight }),
          position: 'relative',

          // Text truncation. Currently enforced on all cells. We may control
          // this with a prop on column config in the future.
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',

          // Need to inherit from the MUI cell because this manages some ordering
          // that the `TableSortLabel` uses to determine the location of the icon
          // in headers.
          flexDirection: 'inherit',
        }}
        style={{
          backgroundColor: backgroundColor ?? 'inherit',
          color: color ?? 'inherit',
        }}
        title={description}
        aria-label={description}
        textAlign={align}
      >
        {children}
      </Box>
    </StyledMuiTableCell>
  );
}
