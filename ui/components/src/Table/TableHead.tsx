import { TableHead as MuiTableHead, styled, TableHeadProps as MuiTableHeadProps } from '@mui/material';
import { forwardRef } from 'react';
import { TableDensity } from './table-model';

type TableHeadProps = MuiTableHeadProps;

// TODO: check on type for tbody
export const TableHead = forwardRef<HTMLTableSectionElement, TableHeadProps>(function TableHead(props, ref) {
  return <MuiTableHead {...props} ref={ref} />;
});
