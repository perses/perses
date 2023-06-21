import { expect } from '@storybook/jest';
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

import type { Meta, StoryObj } from '@storybook/react';
import { Table, TableProps } from '@perses-dev/components';
import { Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, waitFor } from '@storybook/testing-library';
import {
  red,
  orange,
  yellow,
  green,
  blue,
  indigo,
  purple,
  red,
  orange,
  yellow,
  green,
  blue,
  indigo,
  purple,
} from '@mui/material/colors';
import { StorySection, StorySection } from '@perses-dev/storybook';

type MockTableData = {
  id: string;
  label: string;
  value: number;
  color: string;
};

const COLUMNS: TableProps<MockTableData>['columns'] = [
  {
    accessorKey: 'label',
    header: 'Label',
    cellDescription: true,
  },
  {
    accessorKey: 'value',
    header: 'Value',
    width: 100,
    align: 'center',
    enableSorting: true,
  },
  {
    accessorKey: 'color',
    header: 'Color',
    headerDescription: 'A color value',
    width: 100,
    align: 'right',
    cell: ({ getValue }) => <span style={{ color: getValue() }}>{getValue()}</span>,
    cellDescription: ({ getValue }) => `Color ${getValue()} in hex.`,
  },
];

const meta: Meta<typeof Table> = {
  component: Table,
  args: {
    height: 400,
    width: 600,
    density: 'standard',
    getRowId: (originalRow) => (originalRow as MockTableData).id,
  },
  argTypes: {
    data: {
      // Hide table for data because we are going to set it to mock data in
      // our stories and large data takes up a lot of space in the args table.
      table: {
        disable: true,
      },
    },
    density: {
      control: 'radio',
      options: ['compact', 'standard'],
    },
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<typeof Table<MockTableData>>;

const COLOR_SHADES = ['400', '800'] as const;
const COLOR_NAMES = [red, orange, yellow, green, blue, indigo, purple];
const MOCK_COLORS = COLOR_SHADES.reduce((results, colorShade) => {
  COLOR_NAMES.map((colorName) => {
    if (colorShade in colorName) {
      results.push(colorName[colorShade]);
    }
  });
  return results;
}, [] as string[]);

function generateMockTableData(count: number): MockTableData[] {
  const data: MockTableData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `row${i}`,
      label: `my column has a label ${i} that may be ellipsized when it does not fit within the column`,
      value: i,
      color: MOCK_COLORS[i % MOCK_COLORS.length] as string,
    });
  }
  return data;
}

export const Basic: Story = {
  args: {
    data: generateMockTableData(1000),
    columns: COLUMNS,
  },
};

/**
 * The `columns` prop is used to configure an array of columns to render in the
 * table.
 *
 * Each column config requires the following properties:
 * - `accessorKey`: property inside a data object that you want to use to populate cell values in this column.
 * - `header`: string to display in the header to identify that column.
 *
 * Each column config may include the following optional properties:
 * - `align`: determinse how the content in the column's cells are aligned. Can be set to: `left`, `right`, or `center`.
 * - `cell`: function used to customize rendering of the content in a given column cell. Note that cells have a hardcoded height your customization must work within.
 * - `cellDescription`: Text to display when hovering over a cell. This can be useful for providing additional information about the column when the content is ellipsized to fit in the space. If set to `true`, it will use the value generated by the `cell` prop if it can be treated as a string.
 * - `enableSorting`: When `true`, the column will be sortable.
 * - `headerDescription`: Text to display when hovering over the header text. This can be useful for providing additional information about the column when you want to keep the header text relatively short to manage the column width.
 * - `sortingFn`: Function that determines sorting. See https://tanstack.com/table/v8/docs/api/features/sorting for supported features.
 * - `width`: determines the size of the column in the table. It can be set to a number indicating a pixel width or to "auto."
 */
export const ColumnConfig: Story = {
  args: {
    data: generateMockTableData(100),
    columns: COLUMNS,
  },
  parameters: {
    // This story is functionally identical to several other ones and mostly
    // exists as a place to hang documentation, so we don't need another
    // screenshot for it.
    happo: false,
  },
};

/**
 * The table has multiple `density` options to support different use cases.
 * The density modifies styling that impacts the size and space taken up by
 * content in the table (e.g. font size, padding).
 */
export const Density: Story = {
  args: {
    height: 300,
    width: 400,
    data: generateMockTableData(100),
    columns: COLUMNS,
  },
  argTypes: {
    data: {
      // Hide configuration because we are setting these values in this story.
      density: {
        disable: true,
      },
    },
  },
  render: (args) => {
    return (
      <Stack spacing={3}>
        <div>
          <Typography variant="h3" gutterBottom>
            standard
          </Typography>
          <Table {...args} density="standard" />
        </div>
        <div>
          <Typography variant="h3" gutterBottom>
            compact
          </Typography>
          <Table {...args} density="compact" />
        </div>
      </Stack>
    );
  },
};

/**
 * If you set, `checkboxSelection` to `true`, the table will render checkboxes
 * in the first column. The state of selected checkboxes is controlled using
 * the `rowSelection` and `onRowSelectionChanged` props. You may modify the
 * color of row checkboxes using the `getCheckboxColor` prop.
 *
 * The table has two variants of row selection behavior specified by `rowSelectionVariant`:
 * - `standard`: clicking a checkbox will toggle that rows's selected/unselected state and will not impact other rows.
 * - `legend`: clicking a checkbox will "focus" that row by selecting it and unselecting other rows. Clicking a checkbox with a modifier key pressed, will change this behavior to behave like `standard`.
 */
export const CheckboxSelection: Story = {
  args: {
    data: generateMockTableData(500),
    columns: COLUMNS,
    checkboxSelection: true,
    getCheckboxColor: (data) => data.color,
  },
  argTypes: {
    // Disabling values managed within the render below.
    onRowSelectionChange: {
      table: {
        disable: true,
      },
    },
    rowSelection: {
      table: {
        disable: true,
      },
    },
    checkboxSelection: {
      table: {
        disable: true,
      },
    },
  },
  render: (args) => {
    const initSelection = args.data.reduce((result, item) => {
      result[item.id] = true;
      return result;
    }, {} as NonNullable<TableProps<MockTableData>['rowSelection']>);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [standardRowSelection, setStandardRowSelection] = useState<TableProps<MockTableData>['rowSelection']>({
      ...initSelection,
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [legendRowSelection, setLegendRowSelection] = useState<TableProps<MockTableData>['rowSelection']>({
      ...initSelection,
    });

    const handleStandardRowSelectionChange: TableProps<MockTableData>['onRowSelectionChange'] = (newRowSelection) => {
      action('onRowSelectionChange')(newRowSelection);
      setStandardRowSelection(newRowSelection);
    };

    const handleLegendRowSelectionChange: TableProps<MockTableData>['onRowSelectionChange'] = (newRowSelection) => {
      action('onRowSelectionChange')(newRowSelection);
      setLegendRowSelection(newRowSelection);
    };

    return (
      <Stack spacing={3}>
        <StorySection title="standard" level="h3">
          <Table
            {...args}
            rowSelectionVariant="standard"
            onRowSelectionChange={handleStandardRowSelectionChange}
            rowSelection={standardRowSelection}
          />
        </StorySection>
        <StorySection title="legend" level="h3">
          <Table
            {...args}
            rowSelectionVariant="legend"
            onRowSelectionChange={handleLegendRowSelectionChange}
            rowSelection={legendRowSelection}
          />
        </StorySection>
      </Stack>
    );
  },
};

type MockTableSortData = {
  id: string;
  simpleString?: string;
  stringWithUpperLower?: string;
  stringWithNumbers?: string;
  numeric?: number;
  date?: Date;
  complex?: {
    value: number;
  };
};

const sortData: MockTableSortData[] = [
  {
    id: '1',
    simpleString: 'alpha',
    stringWithUpperLower: 'alpha',
    stringWithNumbers: '10',
    numeric: 10,
    date: new Date('2023-01-01T12:00:00'),
    complex: {
      value: 10,
    },
  },
  {
    id: '2',
    simpleString: 'bravo',
    stringWithUpperLower: 'BRAVO',
    stringWithNumbers: '2',
    numeric: 2,
    date: new Date('2023-05-05T16:00:00'),
    complex: {
      value: 2,
    },
  },
  {
    id: '3',
    simpleString: 'charlie',
    stringWithUpperLower: 'charlie',
    stringWithNumbers: '30',
    numeric: 30,
    date: new Date('2023-01-01T16:00:00'),
    complex: {
      value: 30,
    },
  },
  {
    id: '4',
    simpleString: 'delta',
    stringWithUpperLower: 'DELTA',
    stringWithNumbers: '100',
    numeric: 100,
    date: new Date('2023-06-05T10:00:00'),
    complex: {
      value: 100,
    },
  },
  {
    id: '5',
    simpleString: 'echo',
    stringWithUpperLower: 'echo',
    stringWithNumbers: '3000',
    numeric: 3000,
    date: new Date('2023-06-05T20:15:00'),
    complex: {
      value: 1300000,
    },
  },
];

export const Sorting: StoryObj<typeof Table<MockTableSortData>> = {
  args: {
    height: 200,
    width: 900,
    density: 'compact',
  },
  render: (args) => {
    // Rules of hooks get confused by storybook's "render" function.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [defaultSorting, setDefaultSorting] = useState<TableProps<MockTableSortData>['sorting']>();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [customSorting, setCustomSorting] = useState<TableProps<MockTableSortData>['sorting']>();

    return (
      <Stack spacing="1">
        <StorySection title="Default Sorting Function" level="h3">
          <Typography variant="body2" component="div">
            <p>
              The default sorting function (what is used when <code>sortingFn</code> is not specified) attempts to infer
              the data type based on the content in the first row and sort accordingly.
            </p>
            <p>
              This works well for simple cases, but can lead to unexpected behavior with more complex data (e.g. numbers
              in strings, strings with upper and lower case, complex data structures). Try sorting some of the examples
              in the table below to see how various data types behave using the default sort.
            </p>
          </Typography>
          <Table
            {...args}
            sorting={defaultSorting}
            onSortingChange={setDefaultSorting}
            columns={[
              {
                accessorKey: 'simpleString',
                header: 'Simple string',
                enableSorting: true,
              },
              {
                accessorKey: 'stringWithUpperLower',
                header: 'String w/ mixed case',
                enableSorting: true,
              },
              {
                accessorKey: 'stringWithNumbers',
                header: 'String w/ number',
                enableSorting: true,
              },
              {
                accessorKey: 'numeric',
                header: 'Number',
                enableSorting: true,
              },
              {
                accessorKey: 'date',
                header: 'Date',
                enableSorting: true,
                cell: ({ getValue }) => getValue()?.toLocaleString(),
                width: 180,
              },
              {
                accessorKey: 'complex',
                header: 'Object',
                enableSorting: true,
                cell: ({ getValue }) => getValue()?.value,
              },
            ]}
            data={sortData}
          />
        </StorySection>
        <StorySection title="Defined Sorting Functions" level="h3">
          <Typography variant="body2" component="div">
            <p>
              If the default sorting behavior does not work for your use case, you may specify a string name or custom
              function. See{' '}
              <a href="https://tanstack.com/table/v8/docs/api/features/sorting#sorting-functions">
                the TanStack Table documentation
              </a>{' '}
              for reference.
            </p>
            <p>
              The examples below use more specific functions to get a more specific sorting than the default behavior.
            </p>
          </Typography>
          <Table
            {...args}
            sorting={customSorting}
            onSortingChange={setCustomSorting}
            columns={[
              {
                accessorKey: 'simpleString',
                header: 'Simple string',
                enableSorting: true,
                sortingFn: 'text',
              },
              {
                accessorKey: 'stringWithUpperLower',
                header: 'String w/ mixed case',
                enableSorting: true,
                sortingFn: 'textCaseSensitive',
              },
              {
                accessorKey: 'stringWithNumbers',
                header: 'String w/ number',
                enableSorting: true,
                sortingFn: 'alphanumeric',
              },
              {
                accessorKey: 'numeric',
                header: 'Number',
                enableSorting: true,
                sortingFn: 'basic',
              },
              {
                accessorKey: 'date',
                header: 'Date',
                enableSorting: true,
                cell: ({ getValue }) => getValue()?.toLocaleString(),
                width: 180,
                sortingFn: 'datetime',
              },
              {
                accessorKey: 'complex',
                header: 'Object',
                enableSorting: true,
                cell: ({ getValue }) => getValue()?.value,
                sortingFn: (rowA, rowB, columnId) => {
                  const aValue = (rowA.getValue(columnId) as MockTableSortData['complex'])?.value || 0;
                  const bValue = (rowB.getValue(columnId) as MockTableSortData['complex'])?.value || 0;

                  return aValue - bValue;
                },
              },
            ]}
            data={sortData}
          />
        </StorySection>
      </Stack>
    );
  },
};

/**
 * Currently, a table with no data shows the header with no rows. This UI may
 * change in the future.
 */
export const NoData: Story = {
  args: {
    data: [],
    columns: COLUMNS,
  },
};

/**
 * The table supports some basic common keyboard navigation to support
 * keyboard-based interactions with the table including:
 * - Initial focus on top left cell.
 * - `right arrow`: moves the focus one cell to the right
 * - `left arrow`: moves the focus one cell to the left
 * - `up arrow`: moves the focus one cell up
 * - `down arrow`: moves the focus one cell down
 * - `home`: moves focus to the top left cell
 * - `end`: moves focus to the bottom right cell
 * - `page up`: moves the focus up approximately one page
 * - `page down`: moves the focus down approximately one page
 */
export const KeyboardNavigation: Story = {
  args: {
    data: generateMockTableData(500),
    columns: COLUMNS,
    checkboxSelection: true,
    getCheckboxColor: (data) => data.color,
  },
  argTypes: {
    // Disabling values managed within the render below.
    onRowSelectionChange: {
      table: {
        disable: true,
      },
    },
    rowSelection: {
      table: {
        disable: true,
      },
    },
    checkboxSelection: {
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    // This story exists to test for interactions. No screenshots.
    happo: false,
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [rowSelection, setRowSelection] = useState<TableProps<MockTableData>['rowSelection']>({});

    const handleRowSelectionChange: TableProps<MockTableData>['onRowSelectionChange'] = (newRowSelection) => {
      action('onRowSelectionChange')(newRowSelection);
      setRowSelection(newRowSelection);
    };

    return <Table {...args} onRowSelectionChange={handleRowSelectionChange} rowSelection={rowSelection} />;
  },
  play: async ({ canvasElement }) => {
    // Need to wait for the virtual table to have a chance to re-render the rows
    // before interactions for some of the auto-scrolling to work. In human
    // interactions, this is a very small amount of time that isn't an issue,
    // but in this programmatic use case, we need to explicitly handle it to
    // have consistent results.
    async function waitForVirtualRows() {
      await waitFor(async () => {
        const rows = await storyCanvas.findAllByRole('row');
        expect(rows.length).toBeGreaterThan(10);
      });
    }

    async function getCellByTextContent(text: string) {
      // Looking up items by the autogenerated names because once we start
      // virtual scrolling, we can no longer depend on the index of rows.
      const matchingText = await storyCanvas.findByText(text, {
        exact: false,
      });
      return matchingText.closest('td,th');
    }

    const storyCanvas = within(canvasElement);

    // First table focus targets the top left cell's checkbox
    userEvent.tab();
    await waitFor(async () => {
      const checkboxes = await storyCanvas.findAllByRole('checkbox');
      expect(checkboxes[0]).toHaveFocus();
    });
    await waitForVirtualRows();

    // End focuses the bottom rightmost cell.
    userEvent.keyboard('{End}');
    await waitFor(async () => {
      const rows = await storyCanvas.findAllByRole('row');
      const lastRow = rows[rows.length - 1];
      if (!lastRow) {
        throw new Error('Unable to find last row');
      }
      const cells = await within(lastRow).findAllByRole('cell');
      expect(cells[cells.length - 1]).toHaveFocus();
    });

    // Home focuses the top leftmost cell's checkbox.
    userEvent.keyboard('{Home}');
    await waitFor(async () => {
      const checkboxes = await storyCanvas.findAllByRole('checkbox');
      expect(checkboxes[0]).toHaveFocus();
    });

    // Down arrow moves down a cell
    userEvent.keyboard('{ArrowDown}');
    await waitFor(async () => {
      const checkboxes = await storyCanvas.findAllByRole('checkbox');
      expect(checkboxes[1]).toHaveFocus();
    });

    // Right arrow moves to next cell on right
    userEvent.keyboard('{ArrowRight}');
    await waitFor(async () => {
      const rows = await storyCanvas.findAllByRole('row');
      const activeRow = rows[1];
      if (!activeRow) {
        throw new Error('Unable to find row');
      }
      const cells = await within(activeRow).findAllByRole('cell');
      expect(cells[1]).toHaveFocus();
    });

    // Arrow right two more times. The focus will stay on the rightmost cell
    // if you are on the last cell.
    userEvent.keyboard('{ArrowRight}');
    for (let i = 0; i < 1; i++) {
      await waitFor(async () => {
        const rows = await storyCanvas.findAllByRole('row');
        const activeRow = rows[1];
        if (!activeRow) {
          throw new Error('Unable to find row');
        }
        const cells = await within(activeRow).findAllByRole('cell');
        expect(cells[2]).toHaveFocus();
      });
    }

    // Left arrow moves to next cell on left
    userEvent.keyboard('{ArrowLeft}');
    await waitFor(async () => {
      const rows = await storyCanvas.findAllByRole('row');
      const activeRow = rows[1];
      if (!activeRow) {
        throw new Error('Unable to find row');
      }
      const cells = await within(activeRow).findAllByRole('cell');
      expect(cells[1]).toHaveFocus();
    });

    // Arrow left two more times. The focus will stay on the leftmost cell's
    // checkbox if you are on the first cell.
    userEvent.keyboard('{ArrowLeft}');
    for (let i = 0; i < 1; i++) {
      await waitFor(async () => {
        const rows = await storyCanvas.findAllByRole('row');
        const activeRow = rows[1];
        if (!activeRow) {
          throw new Error('Unable to find row');
        }
        const checkboxes = await within(activeRow).findAllByRole('checkbox');
        expect(checkboxes[0]).toHaveFocus();
      });
    }

    // Shift right back to a non-checkbox cell
    userEvent.keyboard('{ArrowRight}');

    const upDownTestSize = 15;

    // Arrow down moves down a cell
    for (let i = 0; i < upDownTestSize; i++) {
      userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        const cell = await getCellByTextContent(`my column has a label ${1 + i} that`);
        expect(cell).toHaveFocus();
      });
      await waitForVirtualRows();
    }

    // Arrow up moves up a cell
    for (let i = 0; i < upDownTestSize; i++) {
      userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        const cell = await getCellByTextContent(`my column has a label ${14 - i} that`);
        expect(cell).toHaveFocus();
      });
      await waitForVirtualRows();
    }

    // Page down moves down a page
    userEvent.keyboard('{PageDown}');
    await waitForVirtualRows();
    await waitFor(async () => {
      const cell = await getCellByTextContent(`my column has a label 9 that`);
      expect(cell).toHaveFocus();
    });

    // Page up moves up a page
    userEvent.keyboard('{PageUp}');
    await waitForVirtualRows();
    await waitFor(async () => {
      const headerColumns = await storyCanvas.findAllByRole('columnheader');
      expect(headerColumns[1]).toHaveFocus();
    });
  },
};
