import { TableRow as MuiTableRow, TableRowProps as MuiTableRowProps } from '@mui/material';
import { forwardRef } from 'react';
import { TableDensity } from './table-model';

interface TableRowProps extends MuiTableRowProps<'div'> {
  density: TableDensity;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(props, ref) {
  return (
    <MuiTableRow
      {...props}
      ref={ref}
      sx={{
        backgroundColor: (theme) => theme.palette.background.paper,
        '&:hover': {
          backgroundColor: (theme) => theme.palette.primary.light,
        },
      }}
    />
  );
});
