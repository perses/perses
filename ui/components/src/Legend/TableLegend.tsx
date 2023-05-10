import { Table } from '../Table';
import { LegendItem } from '../model';

export interface TableLegendProps {
  items: LegendItem[];
  height: number;
  width: number;
}

export function TableLegend({ items, ...otherProps }: TableLegendProps) {
  return <Table {...otherProps} data={items} />;
}
