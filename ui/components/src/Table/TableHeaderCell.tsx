import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps, Box, useTheme } from '@mui/material';
import { forwardRef } from 'react';
import { TableDensity, getCellLayoutProps } from './layoutUtils';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: 0,
}));

interface TableHeaderCellProps extends MuiTableCellProps {
  density: TableDensity;
}

// TODO: see if this can extend TableCell
export function TableHeaderCell({ children, density, ...otherProps }: TableHeaderCellProps) {
  const theme = useTheme();

  // TODO: set up ellipsizing without losing the inherited styles.
  return (
    <StyledMuiTableCell {...otherProps}>
      <Box
        sx={{
          ...getCellLayoutProps(theme, density),
          // Putting a border on the `th` does not work when scrolling because
          // of border collapse combined with the `td`s not having borders.
          borderBottom: (theme) => `solid 1px ${theme.palette.divider}`,
        }}
      >
        {children}
      </Box>
    </StyledMuiTableCell>
  );
}
