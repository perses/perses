import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent, getAllByRole, act } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { Table, TableProps } from './Table';

type MockTableData = {
  id: string;
  label: string;
  value: number;
};

type RenderTableOpts = Partial<Pick<TableProps<MockTableData>, 'data' | 'height' | 'width'>>;

const COLUMNS: TableProps<MockTableData>['columns'] = [
  {
    accessorKey: 'label',
    header: 'Label',
    cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
  },
  {
    accessorKey: 'value',
    header: 'Value',
    size: 100,
  },
  {
    accessorKey: 'color',
    header: 'Color',
    size: 100,
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

const MOCK_VIEWPORT_HEIGHT = 1000;
const MOCK_ITEM_HEIGHT = 100;
const HEADER_ROWS = 1;
const SPACER_ROWS = 1;

const renderTable = ({ data = generateMockTableData(5), height = 600, width = 300 }: RenderTableOpts = {}) => {
  return render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: height, itemHeight: MOCK_ITEM_HEIGHT }}>
      <Table data={data} columns={COLUMNS} height={height} width={width} />
    </VirtuosoMockContext.Provider>
  );
};

const LARGE_TABLE_OVERALL_ROWS = 100;
const LARGE_TABLE_VISIBLE_ROWS = 5;
const LARGE_TABLE_DATA = generateMockTableData(LARGE_TABLE_OVERALL_ROWS);

const renderLargeTable = () => {
  // TODO: make some height utils to help simplfiy. Remember that the header
  // isn't in the virtual scroll.
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

    const tableHeadings = screen.getAllByRole('columnheader');
    expect(tableHeadings).toHaveLength(COLUMNS.length);

    tableHeadings.forEach((tableHeading, i) => {
      const column = COLUMNS[i];

      if (!column) {
        // This is here to appease typescript
        throw new Error('Missing column for table headling');
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

    // TODO: make some height utils to help simplfiy. Remember that the header
    // isn't in the virtual scroll.
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

    const table = screen.getByRole('table');
    fireEvent.scroll(table);
  });

  // TODO: look at where first tabindex should gooo.
  test('on tab the first column header is focused', () => {
    renderLargeTable();

    // Tab focuses the top left cell, which is the first column header.
    userEvent.tab();
    expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();
  });

  describe('when table is focused', () => {
    test('left and right arrow move focus left and right within table cells', () => {
      renderLargeTable();

      userEvent.tab();
      expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();

      // Right arrow moves right to next column header.
      userEvent.keyboard('{ArrowRight}');
      expect(screen.getAllByRole('columnheader')[1]).toHaveFocus();

      // Right arrow moves right to next column header.
      userEvent.keyboard('{ArrowRight}');
      expect(screen.getAllByRole('columnheader')[2]).toHaveFocus();

      // Right arrow does nothing if already focusing the rightmost column.
      userEvent.keyboard('{ArrowRight}');
      expect(screen.getAllByRole('columnheader')[2]).toHaveFocus();

      // Right arrow moves left to previous column header.
      userEvent.keyboard('{ArrowLeft}');
      expect(screen.getAllByRole('columnheader')[1]).toHaveFocus();

      // Right arrow moves left to previous column header.
      userEvent.keyboard('{ArrowLeft}');
      expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();

      // Left arrow does nothing if already focusing the leftmost column.
      userEvent.keyboard('{ArrowLeft}');
      expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();
    });

    test('up and down arrow move focus up and down within table cells', () => {
      renderLargeTable();

      userEvent.tab();
      expect(screen.getAllByRole('columnheader')[0]).toHaveFocus();

      for (let i = 0; i < LARGE_TABLE_VISIBLE_ROWS; i++) {
        act(() => {
          userEvent.keyboard('{ArrowDown}');
        });
        expect(getTableCellByIndex(i + 1, 0)).toHaveFocus();
      }
      // TODO: figure out the virtualization story
    });
  });
});
