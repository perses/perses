import { TableRow as MuiTableRow, TableRowProps as MuiTableRowProps } from '@mui/material';
import { forwardRef } from 'react';

type TableRowProps = MuiTableRowProps<'div'>;

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(props, ref) {
  return (
    <MuiTableRow
      {...props}
      ref={ref}
      sx={{
        '&:hover': {
          backgroundColor: (theme) => theme.palette.background.default,
        },
      }}
    />
  );
});
