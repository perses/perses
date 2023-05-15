import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps, Box, useTheme } from '@mui/material';
import { forwardRef } from 'react';
import { TableDensity, getCellPadding, getCellLayoutProps } from './layoutUtils';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme }) => ({
  padding: 0,
}));

export interface TableCellProps extends MuiTableCellProps {
  density: TableDensity;
}

export function TableCell({ children, density, ...otherProps }: TableCellProps) {
  const theme = useTheme();

  return (
    <StyledMuiTableCell {...otherProps}>
      <Box
        sx={{
          ...getCellLayoutProps(theme, density),
          // padding: (theme) => getCellPadding(theme, density),
        }}
      >
        {children}
      </Box>
    </StyledMuiTableCell>
  );
}
