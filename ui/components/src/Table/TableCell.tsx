import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps, Box } from '@mui/material';
import { forwardRef } from 'react';
import { TableDensity } from './Table';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme }) => ({
  padding: 0,
}));

type TableCellProps = MuiTableCellProps & {
  density: TableDensity;
};

export function TableCell({ children, ...otherProps }: TableCellProps) {
  return (
    <StyledMuiTableCell {...otherProps}>
      <Box
        sx={{
          padding: (theme) => theme.spacing(0.25, 0.5),
        }}
      >
        {children}
      </Box>
    </StyledMuiTableCell>
  );
}
