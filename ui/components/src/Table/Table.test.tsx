import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
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

const renderTable = ({ data = generateMockTableData(5), height = 600, width = 300 }: RenderTableOpts = {}) => {
  console.log(`height: ${height}`);
  return render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: height, itemHeight: MOCK_ITEM_HEIGHT }}>
      <Table data={data} columns={COLUMNS} height={height} width={width} />
    </VirtuosoMockContext.Provider>
  );
};

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

  test('does not render all table rows when they will not fit', () => {
    const headerRows = 1;
    const spacerRow = 1;
    const dataRows = 100;
    const data = generateMockTableData(dataRows);
    const rowsToRender = 5;

    // TODO: make some height utils to help simplfiy. Remember that the header
    // isn't in the virtual scroll.
    const height = rowsToRender * MOCK_ITEM_HEIGHT;
    console.log(height);

    renderTable({ data, height });

    const tableRows = screen.getAllByRole('row');
    expect(tableRows).toHaveLength(rowsToRender + headerRows + spacerRow);
  });
});
