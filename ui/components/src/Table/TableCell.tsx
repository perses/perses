import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps, Box, useTheme } from '@mui/material';
import { forwardRef } from 'react';
import { combineSx } from '../utils';
import { TableDensity, getCellLayoutProps } from './layoutUtils';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme, variant }) => ({
  padding: 0,
  backgroundColor: 'inherit',

  '&.MuiTableCell-head': {
    // Important to avoid scrolling behind the header showing through.
    backgroundColor: theme.palette.background.paper,
  },
}));

export interface TableCellProps extends MuiTableCellProps {
  density: TableDensity;
}

export function TableCell({ children, density, variant, width, ...otherProps }: TableCellProps) {
  const theme = useTheme();

  const isHeader = variant === 'head';
  const isCompact = density === 'compact';

  return (
    <StyledMuiTableCell
      {...otherProps}
      sx={{
        width: width,
        borderBottom: isHeader || !isCompact ? (theme) => `solid 1px ${theme.palette.divider}` : 'none',
      }}
    >
      <Box
        sx={{
          ...getCellLayoutProps(theme, density),
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
