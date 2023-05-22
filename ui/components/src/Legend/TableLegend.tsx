import { ColumnDef, CellContext } from '@tanstack/react-table';
import { useMemo } from 'react';
import { Table, TableProps, TableColumnConfig } from '../Table';
import { LegendItem } from '../model';

export interface TableLegendProps extends Pick<TableProps<LegendItem>, 'onRowSelectionChange'> {
  items: LegendItem[];
  height: number;
  width: number;
  selectedItems: TableProps<LegendItem>['rowSelection'] | 'ALL';
}

const COLUMNS: Array<TableColumnConfig<LegendItem>> = [
  {
    accessorKey: 'label',
    header: 'Name',

    // Stating with `title` attr instead of a tooltip because it is easier to
    // implement. We should try adding a tooltip in the future, but we'll need
    // to be very careful about performance when doing so with large tables.
    cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
  },
];

export function TableLegend({ items, selectedItems: initRowSelection, ...tableProps }: TableLegendProps) {
  const rowSelection =
    typeof initRowSelection !== 'string'
      ? initRowSelection
      : // Turn "ALL" state into a table component friendly map of all of the selected
        // items for checkboxes.
        // TODO: clean this up if we switch to also using checkboxes in list legend.
        items.reduce((allRowSelection, item) => {
          allRowSelection[item.id] = true;
          return allRowSelection;
        }, {} as Record<string, boolean>);

  return (
    <Table
      {...tableProps}
      rowSelection={rowSelection}
      data={items}
      columns={COLUMNS}
      density="compact"
      getRowId={(data) => {
        return data.id;
      }}
      getCheckboxColor={(data) => {
        return data.color;
      }}
      checkboxSelection
    />
  );
}
