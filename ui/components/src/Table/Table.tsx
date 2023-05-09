import { VirtualizedTable } from './VirtualizedTable';

export interface TableProps {
  height: number;
  width: number;
  data?: unknown;
}

export function Table(props: TableProps) {
  return <VirtualizedTable {...props} />;
}
