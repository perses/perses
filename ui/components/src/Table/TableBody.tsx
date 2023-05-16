import { TableBody as MuiTableBody, styled, TableBodyProps as MuiTableBodyProps } from '@mui/material';
import { forwardRef } from 'react';

const StyledMuiTableBody = styled(MuiTableBody)(({ theme }) => ({}));

type TableBodyProps = MuiTableBodyProps;

// TODO: check on type for tbody
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(props, ref) {
  return <StyledMuiTableBody {...props} ref={ref} />;
});
