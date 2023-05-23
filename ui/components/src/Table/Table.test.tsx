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

import userEvent from '@testing-library/user-event';
import { render, screen, getAllByRole, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { Table } from './Table';
import { TableProps } from './model/table-model';

type MockTableData = {
  id: string;
  label: string;
  value: number;
};

type RenderTableOpts = Partial<
  Pick<
    TableProps<MockTableData>,
    'data' | 'height' | 'width' | 'checkboxSelection' | 'onRowSelectionChange' | 'rowSelection'
  >
>;

const COLUMNS: TableProps<MockTableData>['columns'] = [
  {
    accessorKey: 'label',
    header: 'Label',
    cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
  },
  {
    accessorKey: 'value',
    header: 'Value',
    width: 100,
  },
  {
    accessorKey: 'color',
    header: 'Color',
    width: 100,
  },
];

function generateMockTableData(count: number): MockTableData[] {
  const data: MockTableData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `row${i}`,
      label: `my column has a label ${i} that may be ellipsized when it does not fit within the column`,
      value: i,
    });
  }
  return data;
}

const MOCK_ITEM_HEIGHT = 100;
const HEADER_ROWS = 1;
const SPACER_ROWS = 1;

const renderTable = ({
  data = generateMockTableData(5),
  height = 600,
  width = 300,
  checkboxSelection,
  rowSelection = {},
  onRowSelectionChange = jest.fn(),
}: RenderTableOpts = {}) => {
  return render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: height, itemHeight: MOCK_ITEM_HEIGHT }}>
      <Table
        data={data}
        columns={COLUMNS}
        height={height}
        width={width}
        checkboxSelection={checkboxSelection}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
      />
    </VirtuosoMockContext.Provider>
  );
};

const LARGE_TABLE_OVERALL_ROWS = 100;
const LARGE_TABLE_VISIBLE_ROWS = 5;
const LARGE_TABLE_DATA = generateMockTableData(LARGE_TABLE_OVERALL_ROWS);

const renderLargeTable = () => {
  const height = LARGE_TABLE_VISIBLE_ROWS * MOCK_ITEM_HEIGHT;

  renderTable({ data: LARGE_TABLE_DATA, height });
};

/**
 * Helper for looking up table cells by the index of the row and column. Useful
 * for testing out keyboard navigations.
 */
function getTableCellByIndex(row: number, column: number) {
  const rowEl = screen.getAllByRole('row')[row];
  if (!rowEl) {
    throw new Error(`Cannot find row at index: ${row}.`);
  }

  const cellEl = getAllByRole(rowEl, 'cell')[column];
  if (!cellEl) {
    throw new Error(`Cannot find cellEl at index: ${column}.`);
  }

  return cellEl;
}

describe('Table', () => {
  test('renders a table with the expected column headings', () => {
    renderTable();
    screen.getByRole('table');

    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(COLUMNS.length);

    columnHeaders.forEach((tableHeading, i) => {
      const column = COLUMNS[i];

      if (!column) {
        // This is here to appease typescript
        throw new Error('Missing column for table heading');
      }

      expect(tableHeading).toHaveTextContent(column.header);
    });
  });

  test('renders all table rows when they will fit', () => {
    const headerRows = 1;
    const dataRows = 5;
    const data = generateMockTableData(dataRows);
    renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT });

    const tableRows = screen.getAllByRole('row');
    expect(tableRows).toHaveLength(data.length + headerRows);
  });

  test('table only renders rows that are visible', () => {
    const dataRows = 100;
    const data = generateMockTableData(dataRows);
    const rowsToRender = 5;
    const height = rowsToRender * MOCK_ITEM_HEIGHT;

    renderTable({ data, height });

    const tableRows = screen.getAllByRole('row');
    expect(tableRows).toHaveLength(rowsToRender + HEADER_ROWS + SPACER_ROWS);

    for (let i = 0; i < rowsToRender; i++) {
      const itemData = data[i];
      // +1 to skip the header
      const row = tableRows[i + 1];
      if (!row || !itemData) {
        // To appease TS.
        throw new Error('Missing row or item data');
      }

      expect(row).toHaveTextContent(itemData.label);
    }
  });

  test('renders table cell content based on accessor', () => {
    const headerRows = 1;
    const dataRows = 5;
    const data = generateMockTableData(dataRows);
    renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT });

    const tableRows = screen.getAllByRole('row');
    expect(tableRows).toHaveLength(data.length + headerRows);

    // Offset 1 to account for header row.
    for (let i = 1; i <= dataRows; i++) {
      const dataRow = data[i - 1];
      const cell = getTableCellByIndex(i, 1);
      expect(cell).toHaveTextContent(`${dataRow?.value}`);
    }
  });

  test('renders table cell content based on a function', () => {
    const headerRows = 1;
    const dataRows = 5;
    const data = generateMockTableData(dataRows);
    renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT });

    const tableRows = screen.getAllByRole('row');
    expect(tableRows).toHaveLength(data.length + headerRows);

    // Offset 1 to account for header row.
    for (let i = 1; i <= dataRows; i++) {
      const dataRow = data[i - 1];
      const cell = getTableCellByIndex(i, 0);

      within(cell).getByTitle(`${dataRow?.label}`);
      expect(cell).toHaveTextContent(`${dataRow?.label}`);
    }
  });

  describe('when checkboxes are enabled', () => {
    test('renders checkbox column followed by specified columns', () => {
      renderTable({ checkboxSelection: true });

      screen.getByRole('table');

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(COLUMNS.length + 1);

      const firstHeader = columnHeaders[0];
      if (!firstHeader) {
        throw new Error('Could not find first column header');
      }
      within(firstHeader).getByRole('checkbox');

      columnHeaders.slice(1).forEach((tableHeading, i) => {
        const column = COLUMNS[i];
        if (!column) {
          // This is here to appease typescript
          throw new Error('Missing column for table heading');
        }
        expect(tableHeading).toHaveTextContent(column.header);
      });
    });

    test('renders each row with a checkbox', () => {
      const dataRows = 100;
      const data = generateMockTableData(dataRows);
      const rowsToRender = 5;
      const height = rowsToRender * MOCK_ITEM_HEIGHT;

      renderTable({ data, height, checkboxSelection: true });

      const tableRows = screen.getAllByRole('row');
      expect(tableRows).toHaveLength(rowsToRender + HEADER_ROWS + SPACER_ROWS);

      for (let i = 0; i < rowsToRender; i++) {
        const itemData = data[i];
        // +1 to skip the header
        const row = tableRows[i + 1];
        if (!row || !itemData) {
          // To appease TS.
          throw new Error('Missing row or item data');
        }

        const cells = within(row).getAllByRole('cell');
        expect(cells).toHaveLength(COLUMNS.length + 1);

        const firstCell = cells[0];
        if (!firstCell) {
          throw new Error(`Missing first cell for row ${i + 1}`);
        }
        within(firstCell).getByRole('checkbox');
      }
    });

    describe('when no checkboxes are selected', () => {
      const noCheckboxRowSelection = {};
      const data = generateMockTableData(3);

      test('selects all after clicking header checkbox', () => {
        const mockOnRowSelectionChange = jest.fn();
        renderTable({
          data: data,
          checkboxSelection: true,
          onRowSelectionChange: mockOnRowSelectionChange,
          rowSelection: noCheckboxRowSelection,
        });

        const table = screen.getByRole('table');
        const checkboxes = within(table).getAllByRole('checkbox');
        const firstCheckbox = checkboxes[0];
        if (!firstCheckbox) {
          throw new Error('Missing first checkbox');
        }

        userEvent.click(firstCheckbox);
        const expectedSelectAll = {
          '0': true,
          '1': true,
          '2': true,
        };
        expect(mockOnRowSelectionChange).toHaveBeenCalledWith(expectedSelectAll);
      });

      test('selects a single row on clicking that row', () => {
        const mockOnRowSelectionChange = jest.fn();
        renderTable({
          data: data,
          checkboxSelection: true,
          onRowSelectionChange: mockOnRowSelectionChange,
          rowSelection: noCheckboxRowSelection,
        });

        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');

        // Note this is index 1 of the content rows because the first row is
        // the header.
        const rowToClick = rows[2];
        if (!rowToClick) {
          throw new Error('Unable to find row');
        }

        userEvent.click(rowToClick);
        expect(mockOnRowSelectionChange).toHaveBeenCalledWith({
          '1': true,
        });
      });

      test('selects a single row on clicking the checkbox in the row', () => {
        const mockOnRowSelectionChange = jest.fn();
        renderTable({
          data: data,
          checkboxSelection: true,
          onRowSelectionChange: mockOnRowSelectionChange,
          rowSelection: noCheckboxRowSelection,
        });

        const table = screen.getByRole('table');
        const checkboxes = within(table).getAllByRole('checkbox');

        // Note this is index 2 of the content rows because the first row is
        // the header.
        const checkboxToClick = checkboxes[3];
        if (!checkboxToClick) {
          throw new Error('Unable to find checkbox');
        }

        userEvent.click(checkboxToClick);
        expect(mockOnRowSelectionChange).toHaveBeenCalledWith({
          '2': true,
        });
      });
    });

    describe('when all checkboxes are selected', () => {
      const data = generateMockTableData(3);
      const allCheckboxRowSelection = {
        '0': true,
        '1': true,
        '2': true,
      };

      test('selects none after clicking header checkbox', () => {
        const mockOnRowSelectionChange = jest.fn();
        renderTable({
          data: data,
          checkboxSelection: true,
          onRowSelectionChange: mockOnRowSelectionChange,
          rowSelection: allCheckboxRowSelection,
        });

        const table = screen.getByRole('table');
        const checkboxes = within(table).getAllByRole('checkbox');
        const firstCheckbox = checkboxes[0];
        if (!firstCheckbox) {
          throw new Error('Missing first checkbox');
        }

        userEvent.click(firstCheckbox);
        const expectedSelectNone = {};
        expect(mockOnRowSelectionChange).toHaveBeenCalledWith(expectedSelectNone);
      });

      test('unselects a row on clicking that row', () => {
        const mockOnRowSelectionChange = jest.fn();
        renderTable({
          data: data,
          checkboxSelection: true,
          onRowSelectionChange: mockOnRowSelectionChange,
          rowSelection: allCheckboxRowSelection,
        });

        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');

        // Note this is index 1 of the content rows because the first row is
        // the header.
        const rowToClick = rows[2];
        if (!rowToClick) {
          throw new Error('Unable to find row');
        }

        userEvent.click(rowToClick);
        expect(mockOnRowSelectionChange).toHaveBeenCalledWith({
          ...allCheckboxRowSelection,
          '1': undefined,
        });
      });

      test('unselects a row on clicking the checkbox in the row', () => {
        const mockOnRowSelectionChange = jest.fn();
        renderTable({
          data: data,
          checkboxSelection: true,
          onRowSelectionChange: mockOnRowSelectionChange,
          rowSelection: allCheckboxRowSelection,
        });

        const table = screen.getByRole('table');
        const checkboxes = within(table).getAllByRole('checkbox');

        // Note this is index 2 of the content rows because the first row is
        // the header.
        const checkboxToClick = checkboxes[3];
        if (!checkboxToClick) {
          throw new Error('Unable to find checkbox');
        }

        userEvent.click(checkboxToClick);
        expect(mockOnRowSelectionChange).toHaveBeenCalledWith({
          ...allCheckboxRowSelection,
          '2': undefined,
        });
      });
    });
  });

  test('on tab the first column header is focused', () => {
    renderLargeTable();

    // Tab focuses the top left cell, which is the first column header.
    userEvent.tab();
    expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();
  });

  // See "keyboard interaction" story for tests for keyboard interactions,
  // which are difficult to test in a jsdom context with the virtualized table.
});
