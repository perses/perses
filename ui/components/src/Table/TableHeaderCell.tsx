import { TableCell as MuiTableCell, styled, TableCellProps as MuiTableCellProps, Box } from '@mui/material';
import { forwardRef } from 'react';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: 0,
}));

type TableHeaderCellProps = MuiTableCellProps;

export function TableHeaderCell({ children, ...otherProps }: TableHeaderCellProps) {
  // TODO: set up ellipsizing without losing the inherited styles.
  return (
    <StyledMuiTableCell {...otherProps}>
      <Box
        sx={{
          // Putting a border on the `th` does not work when scrolling because
          // of border collapse combined with the `td`s not having borders.
          borderBottom: (theme) => `solid 1px ${theme.palette.divider}`,

          // TODO: modify padding by density -- add a util
          padding: (theme) => theme.spacing(0.25, 0.5),
        }}
      >
        {children}
      </Box>
    </StyledMuiTableCell>
  );
}
