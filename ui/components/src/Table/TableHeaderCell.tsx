import { TableSortLabel, Typography, tableSortLabelClasses } from '@mui/material';
import { SortDirection } from './model/table-model';
import { TableCell, TableCellProps } from './TableCell';

export interface TableHeaderCellProps extends TableCellProps {
  canSort?: boolean;
  onSort?: ((event: unknown) => void) | undefined;
  sortDirection?: SortDirection;
  nextSortDirection?: SortDirection;
}

export function TableHeaderCell({
  canSort,
  onSort,
  sortDirection,
  nextSortDirection,
  children,
  ...cellProps
}: TableHeaderCellProps) {
  const showSortLabel = !!canSort && !!onSort;

  const headerText = (
    <Typography noWrap variant="inherit" component="div" color="inherit">
      {children}
    </Typography>
  );

  const isActive = !!sortDirection;
  const direction = isActive ? sortDirection : nextSortDirection;

  return (
    <TableCell {...cellProps}>
      {showSortLabel ? (
        <TableSortLabel
          onClick={onSort}
          direction={direction}
          active={isActive}
          sx={{
            // Overrides a default vertical alignment in the CSS that changes
            // the header vertical rhythm in a way that's inconsistent with
            // non-sorting headers.
            verticalAlign: 'unset',

            // Makes it possible to ellipsize the text if it's too long.
            maxWidth: '100%',

            // Make the arrow visible when focused using the keyboard to assist
            // with a11y.
            '&:focus-visible': {
              [`& .${tableSortLabelClasses.icon}`]: {
                opacity: isActive ? 1 : 0.5,
              },
            },
          }}
        >
          {headerText}
        </TableSortLabel>
      ) : (
        headerText
      )}
    </TableCell>
  );
}
