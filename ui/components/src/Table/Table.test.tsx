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
import { TableColumnConfig, TableProps } from './model/table-model';

type MockTableData = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type RenderTableOpts = Partial<
  Pick<
    TableProps<MockTableData>,
    | 'data'
    | 'height'
    | 'width'
    | 'checkboxSelection'
    | 'onRowSelectionChange'
    | 'rowSelection'
    | 'columns'
    | 'rowSelectionVariant'
    | 'onSortingChange'
    | 'onRowMouseOver'
    | 'onRowMouseOut'
    | 'sorting'
  >
>;

const COLUMNS: TableProps<MockTableData>['columns'] = [
  {
    accessorKey: 'label',
    header: 'Label',
    cell: ({ getValue }) => `Cell content for ${getValue()}`,
  },
  {
    accessorKey: 'value',
    header: 'Value',
    width: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'color',
    header: 'Color',
    headerDescription: 'Hex codes for colors',
    width: 100,
    cell: ({ getValue }) => <div data-testid="wrapper">{getValue()}</div>,
    enableSorting: true,
  },
];

function generateMockTableData(count: number): MockTableData[] {
  const data: MockTableData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `row${i}`,
      label: `my column has a label ${i} that may be ellipsized when it does not fit within the column`,
      value: i,
      color: i.toString(16),
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
  columns = COLUMNS,
  rowSelectionVariant,
  sorting,
  onSortingChange = jest.fn(),
  onRowMouseOver = jest.fn(),
  onRowMouseOut = jest.fn(),
}: RenderTableOpts = {}) => {
  return render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: height, itemHeight: MOCK_ITEM_HEIGHT }}>
      <Table
        data={data}
        columns={columns}
        height={height}
        width={width}
        checkboxSelection={checkboxSelection}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        onRowMouseOver={onRowMouseOver}
        onRowMouseOut={onRowMouseOut}
        rowSelectionVariant={rowSelectionVariant}
        sorting={sorting}
        onSortingChange={onSortingChange}
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

  test('columns with heading descriptions include the description as a title attr', () => {
    renderTable();
    screen.getByRole('table');

    const columnHeaders = screen.getAllByRole('columnheader');
    columnHeaders.forEach((tableHeading, i) => {
      const column = COLUMNS[i];

      if (!column) {
        // This is here to appease typescript
        throw new Error('Missing column for table heading');
      }

      if (column.headerDescription) {
        expect(tableHeading.firstChild).toHaveAttribute('title', column.headerDescription);
      } else {
        expect(tableHeading.firstChild).not.toHaveAttribute('title');
      }
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

  describe('when column `cell` not defined', () => {
    const columnWithoutCell = 1;

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
        const cell = getTableCellByIndex(i, columnWithoutCell);
        expect(cell).toHaveTextContent(`${dataRow?.value}`);
      }
    });

    describe('when `cellDescription` not defined', () => {
      test('table cell does not have a description', () => {
        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const cell = getTableCellByIndex(i, columnWithoutCell);
          expect(cell.firstChild).not.toHaveAttribute('title');
        }
      });
    });

    describe('when `cellDescription` is `true`', () => {
      test('table cell has a description based on accessor', () => {
        const columns = COLUMNS.map((col, i) => {
          if (i === columnWithoutCell) {
            return {
              ...col,
              cellDescription: true,
            };
          }
          return col;
        });

        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT, columns });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const dataRow = data[i - 1];
          const cell = getTableCellByIndex(i, columnWithoutCell);
          expect(cell.firstChild).toHaveAttribute('title', `${dataRow?.value}`);
        }
      });
    });

    describe('when `cellDescription` is a function', () => {
      test('table cell has a description based on the function', () => {
        const columns: Array<TableColumnConfig<MockTableData>> = COLUMNS.map((col, i) => {
          if (i === columnWithoutCell) {
            return {
              ...col,
              cellDescription: ({ getValue }) => `Description for ${getValue()}`,
            };
          }
          return col;
        });

        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT, columns });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const dataRow = data[i - 1];
          const cell = getTableCellByIndex(i, columnWithoutCell);
          expect(cell.firstChild).toHaveAttribute('title', `Description for ${dataRow?.value}`);
        }
      });
    });
  });

  describe('when column `cell` is defined and returns a string', () => {
    const columnWithCell = 0;

    test('renders table cell content based on `cell` function', () => {
      const headerRows = 1;
      const dataRows = 5;
      const data = generateMockTableData(dataRows);
      renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT });

      const tableRows = screen.getAllByRole('row');
      expect(tableRows).toHaveLength(data.length + headerRows);

      // Offset 1 to account for header row.
      for (let i = 1; i <= dataRows; i++) {
        const dataRow = data[i - 1];
        const cell = getTableCellByIndex(i, columnWithCell);

        expect(cell).toHaveTextContent(`Cell content for ${dataRow?.label}`);
      }
    });

    describe('when `cellDescription` not defined', () => {
      test('table cell does not have a description', () => {
        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const cell = getTableCellByIndex(i, columnWithCell);
          expect(cell.firstChild).not.toHaveAttribute('title');
        }
      });
    });

    describe('when `cellDescription` is `true`', () => {
      test('table cell has a description based on `cell` function', () => {
        const columns = COLUMNS.map((col, i) => {
          if (i === columnWithCell) {
            return {
              ...col,
              cellDescription: true,
            };
          }
          return col;
        });

        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT, columns });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const dataRow = data[i - 1];
          const cell = getTableCellByIndex(i, columnWithCell);
          expect(cell.firstChild).toHaveAttribute('title', `Cell content for ${dataRow?.label}`);
        }
      });
    });

    describe('when `cellDescription` is a function', () => {
      test('table cell has a description based on the function', () => {
        const columns: Array<TableColumnConfig<MockTableData>> = COLUMNS.map((col, i) => {
          if (i === columnWithCell) {
            return {
              ...col,
              cellDescription: ({ getValue }) => `Description for ${getValue()}`,
            };
          }
          return col;
        });

        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT, columns });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const dataRow = data[i - 1];
          const cell = getTableCellByIndex(i, columnWithCell);
          expect(cell.firstChild).toHaveAttribute('title', `Description for ${dataRow?.label}`);
        }
      });
    });
  });

  describe('when column `cell` is defined and returns a non-string', () => {
    const columnWithComplexCell = 2;

    test('renders table cell content based on `cell` function', () => {
      const headerRows = 1;
      const dataRows = 5;
      const data = generateMockTableData(dataRows);
      renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT });

      const tableRows = screen.getAllByRole('row');
      expect(tableRows).toHaveLength(data.length + headerRows);

      // Offset 1 to account for header row.
      for (let i = 1; i <= dataRows; i++) {
        const dataRow = data[i - 1];
        const cell = getTableCellByIndex(i, columnWithComplexCell);

        within(cell).getByTestId('wrapper');
        expect(cell).toHaveTextContent(`${dataRow?.color}`);
      }
    });

    describe('when `cellDescription` not defined', () => {
      test('table cell does not have a description', () => {
        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const cell = getTableCellByIndex(i, columnWithComplexCell);
          expect(cell.firstChild).not.toHaveAttribute('title');
        }
      });
    });

    describe('when `cellDescription` is `true`', () => {
      test('table cell does not have a description because the `cell` result cannot be put in a `title`', () => {
        const columns = COLUMNS.map((col, i) => {
          if (i === columnWithComplexCell) {
            return {
              ...col,
              cellDescription: true,
            };
          }
          return col;
        });

        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT, columns });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const cell = getTableCellByIndex(i, columnWithComplexCell);
          expect(cell.firstChild).not.toHaveAttribute('title');
        }
      });
    });

    describe('when `cellDescription` is a function', () => {
      test('table cell has a description based on the function', () => {
        const columns: Array<TableColumnConfig<MockTableData>> = COLUMNS.map((col, i) => {
          if (i === columnWithComplexCell) {
            return {
              ...col,
              cellDescription: ({ getValue }) => `Description for ${getValue()}`,
            };
          }
          return col;
        });

        const headerRows = 1;
        const dataRows = 5;
        const data = generateMockTableData(dataRows);
        renderTable({ data, height: dataRows * MOCK_ITEM_HEIGHT, columns });

        const tableRows = screen.getAllByRole('row');
        expect(tableRows).toHaveLength(data.length + headerRows);

        // Offset 1 to account for header row.
        for (let i = 1; i <= dataRows; i++) {
          const dataRow = data[i - 1];
          const cell = getTableCellByIndex(i, columnWithComplexCell);
          expect(cell.firstChild).toHaveAttribute('title', `Description for ${dataRow?.color}`);
        }
      });
    });
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

      // Behavior shouldn't be different between variations in this case, so use an each.
      describe.each(['standard', 'legend'] as const)('with "%s" row selection', (rowSelectionVariant) => {
        test('selects a single row on clicking that row', () => {
          const mockOnRowSelectionChange = jest.fn();
          renderTable({
            data: data,
            checkboxSelection: true,
            onRowSelectionChange: mockOnRowSelectionChange,
            rowSelection: noCheckboxRowSelection,
            rowSelectionVariant: rowSelectionVariant,
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
    });

    describe('when all checkboxes are selected', () => {
      const data = generateMockTableData(3);
      const allCheckboxRowSelection = {
        '0': true,
        '1': true,
        '2': true,
      };

      // Able to test the standard and legend with modified together.
      // Testing un-modified legend separately because it behaves differently.
      describe.each([
        ['standard', false],
        ['legend', true],
      ] as const)('with "%s" row selection (modifed: %p)', (rowSelectionVariant, isModifed) => {
        test('selects none after clicking header checkbox', () => {
          const mockOnRowSelectionChange = jest.fn();
          renderTable({
            data: data,
            checkboxSelection: true,
            onRowSelectionChange: mockOnRowSelectionChange,
            rowSelection: allCheckboxRowSelection,
            rowSelectionVariant: rowSelectionVariant,
          });

          const table = screen.getByRole('table');
          const checkboxes = within(table).getAllByRole('checkbox');
          const firstCheckbox = checkboxes[0];
          if (!firstCheckbox) {
            throw new Error('Missing first checkbox');
          }

          userEvent.click(firstCheckbox, {
            shiftKey: isModifed,
          });
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
            rowSelectionVariant: rowSelectionVariant,
          });

          const table = screen.getByRole('table');
          const rows = within(table).getAllByRole('row');

          // Note this is index 1 of the content rows because the first row is
          // the header.
          const rowToClick = rows[2];
          if (!rowToClick) {
            throw new Error('Unable to find row');
          }

          userEvent.click(rowToClick, {
            shiftKey: isModifed,
          });
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
            rowSelectionVariant: rowSelectionVariant,
          });

          const table = screen.getByRole('table');
          const checkboxes = within(table).getAllByRole('checkbox');

          // Note this is index 2 of the content rows because the first row is
          // the header.
          const checkboxToClick = checkboxes[3];
          if (!checkboxToClick) {
            throw new Error('Unable to find checkbox');
          }

          userEvent.click(checkboxToClick, {
            metaKey: isModifed,
          });
          expect(mockOnRowSelectionChange).toHaveBeenCalledWith({
            ...allCheckboxRowSelection,
            '2': undefined,
          });
        });
      });

      describe('with "legend" row selection (modifed: false)', () => {
        const rowSelectionVariant = 'legend' as const;

        test('selects none after clicking header checkbox', () => {
          const mockOnRowSelectionChange = jest.fn();
          renderTable({
            data: data,
            checkboxSelection: true,
            onRowSelectionChange: mockOnRowSelectionChange,
            rowSelection: allCheckboxRowSelection,
            rowSelectionVariant: rowSelectionVariant,
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

        test('focuses a row on clicking that row', () => {
          const mockOnRowSelectionChange = jest.fn();
          renderTable({
            data: data,
            checkboxSelection: true,
            onRowSelectionChange: mockOnRowSelectionChange,
            rowSelection: allCheckboxRowSelection,
            rowSelectionVariant: rowSelectionVariant,
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

        test('focuses a row on clicking the checkbox in the row', () => {
          const mockOnRowSelectionChange = jest.fn();
          renderTable({
            data: data,
            checkboxSelection: true,
            onRowSelectionChange: mockOnRowSelectionChange,
            rowSelection: allCheckboxRowSelection,
            rowSelectionVariant: rowSelectionVariant,
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
    });
  });

  describe('when sorting is enabled for a column', () => {
    // We use this column for most of the testing
    const sortingColumn = 1;
    // We use this column to validate what happens when clicking another sort.
    const anotherSortingColumn = 2;

    test('header is a clickable button', () => {
      renderTable();
      screen.getByRole('table');

      const columnHeaders = screen.getAllByRole('columnheader');
      columnHeaders.forEach((colHeader, i) => {
        if (i === sortingColumn || i === anotherSortingColumn) {
          within(colHeader).getByRole('button');
        } else {
          expect(within(colHeader).queryAllByRole('button')).toHaveLength(0);
        }
      });
    });

    describe('when column not currently sorted', () => {
      const sortingState: TableProps<MockTableData>['sorting'] = undefined;

      test('the column is not shown as "active"', () => {
        renderTable({
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        expect(within(columnHeader).getByRole('button')).not.toHaveClass('Mui-active');
      });

      test('the direction icon shows descending as next state', () => {
        renderTable({
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        const icon = within(columnHeader).getByTestId('ArrowDownwardIcon');
        expect(icon).toHaveClass('MuiTableSortLabel-iconDirectionDesc');
      });

      test('changes sorting to descending on clicking the header', () => {
        const mockOnSortingChange = jest.fn();
        renderTable({
          onSortingChange: mockOnSortingChange,
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        userEvent.click(within(columnHeader).getByRole('button'));
        expect(mockOnSortingChange).toHaveBeenCalledWith([
          {
            desc: true,
            id: 'value',
          },
        ]);
      });

      test('changes sorting to unsorted on clicking another sortable column', () => {
        const mockOnSortingChange = jest.fn();
        renderTable({
          onSortingChange: mockOnSortingChange,
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[anotherSortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        userEvent.click(within(columnHeader).getByRole('button'));
        expect(mockOnSortingChange).toHaveBeenCalledWith([
          {
            desc: true,
            id: 'color',
          },
        ]);
      });
    });

    describe('when column is sorted descending', () => {
      const sortingState: TableProps<MockTableData>['sorting'] = [
        {
          desc: true,
          id: 'value',
        },
      ];

      test('the column is shown as "active"', () => {
        renderTable({
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        expect(within(columnHeader).getByRole('button')).toHaveClass('Mui-active');
      });

      test('the direction icon shows descending as current state', () => {
        renderTable({
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        const icon = within(columnHeader).getByTestId('ArrowDownwardIcon');
        expect(icon).toHaveClass('MuiTableSortLabel-iconDirectionDesc');
      });

      test('changes sorting to ascending on clicking the header', () => {
        const mockOnSortingChange = jest.fn();
        renderTable({
          onSortingChange: mockOnSortingChange,
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        userEvent.click(within(columnHeader).getByRole('button'));
        expect(mockOnSortingChange).toHaveBeenCalledWith([
          {
            desc: false,
            id: 'value',
          },
        ]);
      });

      test('changes sorting to unsorted on clicking another sortable column', () => {
        const mockOnSortingChange = jest.fn();
        renderTable({
          onSortingChange: mockOnSortingChange,
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[anotherSortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        userEvent.click(within(columnHeader).getByRole('button'));
        expect(mockOnSortingChange).toHaveBeenCalledWith([
          {
            desc: true,
            id: 'color',
          },
        ]);
      });
    });

    describe('when column is sorted ascending', () => {
      const sortingState: TableProps<MockTableData>['sorting'] = [
        {
          desc: false,
          id: 'value',
        },
      ];

      test('the column is shown as "active"', () => {
        renderTable({
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        expect(within(columnHeader).getByRole('button')).toHaveClass('Mui-active');
      });

      test('the direction icon shows ascending as current state', () => {
        renderTable({
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        const icon = within(columnHeader).getByTestId('ArrowDownwardIcon');
        expect(icon).toHaveClass('MuiTableSortLabel-iconDirectionAsc');
      });

      test('changes sorting to unsorted on clicking the header', () => {
        const mockOnSortingChange = jest.fn();
        renderTable({
          onSortingChange: mockOnSortingChange,
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[sortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        userEvent.click(within(columnHeader).getByRole('button'));
        expect(mockOnSortingChange).toHaveBeenCalledWith([]);
      });

      test('changes sorting to unsorted on clicking another sortable column', () => {
        const mockOnSortingChange = jest.fn();
        renderTable({
          onSortingChange: mockOnSortingChange,
          sorting: sortingState,
        });
        screen.getByRole('table');

        const columnHeader = screen.getAllByRole('columnheader')[anotherSortingColumn];
        if (!columnHeader) {
          throw new Error('cannot find sortable header');
        }
        userEvent.click(within(columnHeader).getByRole('button'));
        expect(mockOnSortingChange).toHaveBeenCalledWith([
          {
            desc: true,
            id: 'color',
          },
        ]);
      });
    });
  });

  describe('on mouse over row', () => {
    test('calls `onRowMouseOver` with event and row information', () => {
      const mockOnRowMouseOver = jest.fn();
      renderTable({ onRowMouseOver: mockOnRowMouseOver });
      screen.getByRole('table');

      const tableRows = screen.getAllByRole('row');

      const row1 = tableRows[HEADER_ROWS + 1];
      if (!row1) {
        throw new Error('Cound not find row.');
      }

      userEvent.hover(row1);
      expect(mockOnRowMouseOver).toHaveBeenCalledWith(
        expect.objectContaining({
          target: row1,
        }),
        {
          id: '1',
          index: 1,
        }
      );
    });
  });

  describe('on mouse out row', () => {
    test('calls `onRowMouseOut` with event and row information', () => {
      const mockOnRowMouseOut = jest.fn();
      renderTable({ onRowMouseOut: mockOnRowMouseOut });
      screen.getByRole('table');

      const tableRows = screen.getAllByRole('row');

      const row2 = tableRows[HEADER_ROWS + 2];
      if (!row2) {
        throw new Error('Cound not find row.');
      }

      userEvent.unhover(row2);
      expect(mockOnRowMouseOut).toHaveBeenCalledWith(
        expect.objectContaining({
          target: row2,
        }),
        {
          id: '2',
          index: 2,
        }
      );
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
