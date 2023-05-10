import { TableRow as MuiTableRow, styled, TableRowProps as MuiTableRowProps } from '@mui/material';
import { forwardRef } from 'react';

const StyledMuiTableRow = styled(MuiTableRow)(({ theme }) => ({}));

type TableRowProps = MuiTableRowProps;

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(props, ref) {
  return (
    <StyledMuiTableRow
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
