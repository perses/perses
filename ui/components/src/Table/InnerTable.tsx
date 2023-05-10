import { Table as MuiTable, styled, TableProps as MuiTableProps } from '@mui/material';
import { forwardRef } from 'react';

const StyledMuiTable = styled(MuiTable)(({ theme }) => ({
  tableLayout: 'fixed',
}));

type InnerTableProps = MuiTableProps;

// TODO: check on type for tbody
export const InnerTable = forwardRef<HTMLTableElement, InnerTableProps>(function InnerTable(props, ref) {
  return <StyledMuiTable {...props} ref={ref} />;
});
