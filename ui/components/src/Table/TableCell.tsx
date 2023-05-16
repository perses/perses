import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps, Box, useTheme } from '@mui/material';
import { forwardRef } from 'react';
import { TableDensity, getCellLayoutProps } from './layoutUtils';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme, variant }) => ({
  padding: 0,
  '&.MuiTableCell-head': {
    // Important to avoid scrolling behind the header showing through.
    backgroundColor: theme.palette.background.paper,
  },
}));

export interface TableCellProps extends MuiTableCellProps {
  density: TableDensity;
}

export function TableCell({ children, density, variant, ...otherProps }: TableCellProps) {
  const theme = useTheme();

  const isHeader = variant === 'head';

  return (
    <StyledMuiTableCell {...otherProps}>
      <Box
        sx={{
          ...getCellLayoutProps(theme, density),
          position: 'relative',

          // We put the border on a div inside the `th` instead of directly on
          // the `th` to ensure it is not lost on scroll caused by the combo of
          // border-collapse and not having borders on the non-header rows.
          borderBottom: isHeader ? (theme) => `solid 1px ${theme.palette.divider}` : undefined,

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
