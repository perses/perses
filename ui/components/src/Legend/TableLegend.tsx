import { Table, TableProps } from '../Table';
import { LegendItem } from '../model';

export interface TableLegendProps {
  items: LegendItem[];
  height: number;
  width: number;
}

const COLUMNS: TableProps<LegendItem>['columns'] = [
  {
    accessorKey: 'label',
    header: 'Name',
  },
];

export function TableLegend({ items, ...otherProps }: TableLegendProps) {
  return <Table {...otherProps} data={items} columns={COLUMNS} />;
}
