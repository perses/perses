import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps } from '@mui/material';
import { forwardRef } from 'react';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme }) => ({}));

type TableCellProps = MuiTableCellProps;

export function TableCell(props) {
  return <StyledMuiTableCell {...props} />;
}
