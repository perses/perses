// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useMemo } from 'react';
import { Table, TableProps, TableColumnConfig } from '../Table';
import { LegendItem } from './legend-model';

export interface TableLegendProps extends Pick<TableProps<LegendItem>, 'sorting' | 'onSortingChange'> {
  items: LegendItem[];
  height: number;
  width: number;
  selectedItems: TableProps<LegendItem>['rowSelection'] | 'ALL';
  onSelectedItemsChange: TableProps<LegendItem>['onRowSelectionChange'];
  onItemMouseOver?: TableProps<LegendItem>['onRowMouseOver'];
  onItemMouseOut?: TableProps<LegendItem>['onRowMouseOut'];
  columns?: TableProps<LegendItem>['columns'];
}

const COLUMNS: Array<TableColumnConfig<LegendItem>> = [
  {
    accessorKey: 'label',
    header: 'Name',
    enableSorting: true,

    // Starting with `title` attr instead of a tooltip because it is easier to
    // implement. We should try adding a tooltip in the future, but we'll need
    // to be very careful about performance when doing so with large tables.
    cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
  },
];

const getRowId: NonNullable<TableProps<LegendItem>['getRowId']> = (data) => {
  return data.id;
};

const getCheckboxColor: TableProps<LegendItem>['getCheckboxColor'] = (data) => {
  return data.color;
};

export function TableLegend({
  items,
  selectedItems: initRowSelection,
  onSelectedItemsChange,
  onItemMouseOver,
  onItemMouseOut,
  height,
  width,
  columns: additionalColumns = [],
  sorting,
  onSortingChange,
}: TableLegendProps) {
  const rowSelection = useMemo(() => {
    return typeof initRowSelection !== 'string'
      ? initRowSelection
      : // Turn "ALL" state into a table component friendly map of all of the selected
        // items for checkboxes.
        // TODO: clean this up if we switch to also using checkboxes in list legend.
        items.reduce((allRowSelection, item, index) => {
          allRowSelection[getRowId(item, index)] = true;
          return allRowSelection;
        }, {} as Record<string, boolean>);
  }, [initRowSelection, items]);

  const columns = useMemo(() => {
    return [...COLUMNS, ...additionalColumns];
  }, [additionalColumns]);

  return (
    <Table
      height={height}
      width={width}
      rowSelection={rowSelection}
      onRowSelectionChange={onSelectedItemsChange}
      onRowMouseOver={onItemMouseOver}
      onRowMouseOut={onItemMouseOut}
      sorting={sorting}
      onSortingChange={onSortingChange}
      data={items}
      columns={columns}
      density="compact"
      getRowId={getRowId}
      getCheckboxColor={getCheckboxColor}
      checkboxSelection
      rowSelectionVariant="legend"
    />
  );
}
