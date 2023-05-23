import {
  TableCell as MuiTableCell,
  styled,
  TableCellProps as MuiTableCellProps,
  Box,
  useTheme,
  Theme,
} from '@mui/material';
import { CSSProperties, forwardRef, useEffect, useRef } from 'react';
import { combineSx } from '../utils';
import { TableDensity, getTableCellLayout } from './table-model';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme, variant }) => ({
  padding: 0,
  backgroundColor: 'inherit',

  '&.MuiTableCell-head': {
    // Important to avoid scrolling behind the header showing through.
    backgroundColor: theme.palette.background.paper,
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
  focusState?: 'trigger-focus' | 'focus-next' | 'none';
}

export function TableCell({
  children,
  density,
  variant,
  width,
  focusState = 'none',
  onFocus,
  ...otherProps
}: TableCellProps) {
  const theme = useTheme();

  const elRef = useRef<HTMLTableCellElement>();

  const isHeader = variant === 'head';
  const isCompact = density === 'compact';

  // TODO: see if this should be a uselayouteffect.
  useEffect(() => {
    if (focusState === 'trigger-focus' && elRef.current) {
      elRef.current.focus();
    }
  }, [focusState]);

  const handleFocus: React.FocusEventHandler<HTMLTableCellElement> = (e) => {
    // From https://zellwk.com/blog/keyboard-focusable-elements/
    // TODO: dig into if this can be cleaned up a bit.
    const nestedFocusTarget = e.currentTarget?.querySelector<HTMLElement>(
      'a[href], button, input, textarea, select, details'
    );
    if (nestedFocusTarget) {
      // If the cell has a focusable child, focus it instead.
      nestedFocusTarget.focus();
    }
  };

  // TODO: Fix typing
  const handleInteractionFocusTrigger = (e: any) => {
    // Causing issues with checkbox. Debug tomorrow.
    onFocus?.(e);
  };

  return (
    <StyledMuiTableCell
      {...otherProps}
      tabIndex={focusState !== 'none' ? 0 : -1}
      onFocus={handleFocus}
      // We use these instead of `onFocus` because of some ordering issues with
      // when the browser calls the various events.
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
          // this with a prop in the future.
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
