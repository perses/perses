import { useMemo } from 'react';
import { Table, TableProps, TableColumnConfig } from '../Table';
import { LegendItem } from '../model';

export interface TableLegendProps {
  items: LegendItem[];
  height: number;
  width: number;
  selectedItems: TableProps<LegendItem>['rowSelection'] | 'ALL';
  onSelectedItemsChange: TableProps<LegendItem>['onRowSelectionChange'];
}

const COLUMNS: Array<TableColumnConfig<LegendItem>> = [
  {
    accessorKey: 'label',
    header: 'Name',

    // Starting with `title` attr instead of a tooltip because it is easier to
    // implement. We should try adding a tooltip in the future, but we'll need
    // to be very careful about performance when doing so with large tables.
    cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
  },
];

const getRowId: TableProps<LegendItem>['getRowId'] = (data) => {
  return data.id;
};

const getCheckboxColor: TableProps<LegendItem>['getCheckboxColor'] = (data) => {
  return data.color;
};

export function TableLegend({
  items,
  selectedItems: initRowSelection,
  onSelectedItemsChange,
  height,
  width,
}: TableLegendProps) {
  const rowSelection = useMemo(() => {
    return typeof initRowSelection !== 'string'
      ? initRowSelection
      : // Turn "ALL" state into a table component friendly map of all of the selected
        // items for checkboxes.
        // TODO: clean this up if we switch to also using checkboxes in list legend.
        items.reduce((allRowSelection, item) => {
          allRowSelection[item.id] = true;
          return allRowSelection;
        }, {} as Record<string, boolean>);
  }, [initRowSelection, items]);

  return (
    <Table
      height={height}
      width={width}
      rowSelection={rowSelection}
      onRowSelectionChange={onSelectedItemsChange}
      data={items}
      columns={COLUMNS}
      density="compact"
      getRowId={getRowId}
      getCheckboxColor={getCheckboxColor}
      checkboxSelection
    />
  );
}
