import { Table as MuiTable, styled, TableProps as MuiTableProps } from '@mui/material';
import { forwardRef } from 'react';
import { TableDensity } from './layoutUtils';

const StyledMuiTable = styled(MuiTable)(({ theme }) => ({
  // This value is needed to have a consistent table layout when scrolling.
  tableLayout: 'fixed',
  borderCollapse: 'separate',
  backgroundColor: theme.palette.background.paper,
}));

type InnerTableProps = Omit<MuiTableProps, 'size'> & {
  density: TableDensity;
};

const TABLE_DENSITY_CONFIG: Record<TableDensity, MuiTableProps['size']> = {
  compact: 'small',
  standard: 'medium',
};

export const InnerTable = forwardRef<HTMLTableElement, InnerTableProps>(function InnerTable(
  { density, width, ...otherProps },
  ref
) {
  return (
    <StyledMuiTable
      {...otherProps}
      size={TABLE_DENSITY_CONFIG[density]}
      ref={ref}
      sx={{
        width: width,
      }}
    />
  );
});
