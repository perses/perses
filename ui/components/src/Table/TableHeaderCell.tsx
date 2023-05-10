import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps } from '@mui/material';
import { forwardRef } from 'react';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

type TableHeaderCellProps = MuiTableCellProps;

export function TableHeaderCell({ children, ...otherProps }: TableHeaderCellProps) {
  // TODO: set up ellipsizing without losing the inherited styles.
  return <StyledMuiTableCell {...otherProps}>{children}</StyledMuiTableCell>;
}
