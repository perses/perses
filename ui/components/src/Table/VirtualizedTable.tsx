import { Box } from '@mui/material';
import { TableProps } from './Table';

type VirtualizedTableProps = TableProps;

// Separating out the virtualized table because we may want a paginated table
// in the future that does not need virtualization, and we'd likely lay them
// out differently.
export function VirtualizedTable({ width, height }: VirtualizedTableProps) {
  return <Box sx={{ width, height }}>table time</Box>;
}
