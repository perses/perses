import { Table } from '../Table';

export interface TableLegendProps {
  height: number;
  width: number;
}

export function TableLegend(props: TableLegendProps) {
  return <Table {...props} />;
}
