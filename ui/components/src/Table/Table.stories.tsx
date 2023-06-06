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
    cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
  },
  {
    accessorKey: 'value',
    header: 'Value',
    width: 100,
    align: 'center',
  },
  {
    accessorKey: 'color',
    header: 'Color',
    width: 100,
    align: 'right',
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

import { red, orange, yellow, green, blue, indigo, purple } from '@mui/material/colors';

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
 * - `width`: determines the size of the column in the table. It can be set to a number indicating a pixel width or to "auto."
 * - `align`: determinse how the content in the column's cells are aligned. Can be set to: `left`, `right`, or `center`.
 * - `cell`: function used to customize rendering of the content in a given column cell. Note that cells have a hardcoded height your customization must work within.
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [rowSelection, setRowSelection] = useState<TableProps<MockTableData>['rowSelection']>({});

    const handleRowSelectionChange: TableProps<MockTableData>['onRowSelectionChange'] = (newRowSelection) => {
      action('onRowSelectionChange')(newRowSelection);
      setRowSelection(newRowSelection);
    };

    return <Table {...args} onRowSelectionChange={handleRowSelectionChange} rowSelection={rowSelection} />;
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
