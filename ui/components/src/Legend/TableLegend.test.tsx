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
import { render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { TableLegend, TableLegendProps } from './TableLegend';

const MOCK_VIEWPORT_HEIGHT = 1000;
const MOCK_ITEM_HEIGHT = 100;

// Using a small number of items because we do not want to dig into testing
// the underlying table virtualization
const MOCK_ITEMS: TableLegendProps['items'] = [
  {
    id: 'one',
    label: 'Label One',
    color: '#ff0000',
  },
  {
    id: 'two',
    label: 'Label Two',
    color: '#00ff00',
  },
  {
    id: 'three',
    label: 'Label Three',
    color: '#0000ff',
  },
];

type RenderTableLegendOpts = Partial<Pick<TableLegendProps, 'selectedItems' | 'onSelectedItemsChange' | 'items'>>;

const renderTableLegend = ({
  items = MOCK_ITEMS,
  selectedItems = 'ALL',
  onSelectedItemsChange = jest.fn(),
}: RenderTableLegendOpts = {}) => {
  return render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: MOCK_VIEWPORT_HEIGHT, itemHeight: MOCK_ITEM_HEIGHT }}>
      <TableLegend
        items={items}
        height={200}
        width={400}
        selectedItems={selectedItems}
        onSelectedItemsChange={onSelectedItemsChange}
      />
    </VirtuosoMockContext.Provider>
  );
};

describe('TableLegend', () => {
  test('renders each legend item as a row in a table', () => {
    renderTableLegend();
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    for (let i = 0; i < MOCK_ITEMS.length; i++) {
      const legendItem = MOCK_ITEMS[i];
      if (!legendItem) {
        throw new Error(`Cannot find data for legend item ${i}`);
      }

      // Add 1 because row 0 is the header
      const row = rows[i + 1];
      if (!row) {
        throw new Error(`Cannot find row for legend item ${i}`);
      }

      // Label includes a title attribute in case it is ellipsized.
      const label = within(row).getByTitle(legendItem.label);
      expect(label).toHaveTextContent(legendItem.label);
    }
  });

  describe('when selected is "ALL"', () => {
    const selectedItems = 'ALL';

    test('all checkboxes are checked', () => {
      renderTableLegend({
        selectedItems,
      });

      const table = screen.getByRole('table');
      const checkboxes = within(table).getAllByRole('checkbox');

      // Add 1 for the select all/none in the header row
      expect(checkboxes).toHaveLength(MOCK_ITEMS.length + 1);

      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    test('selects none on click header checkbox', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderTableLegend({
        selectedItems,
        onSelectedItemsChange: mockOnSelectedItemsChange,
      });

      const table = screen.getByRole('table');
      const headerCheckbox = within(table).getAllByRole('checkbox')[0];

      if (!headerCheckbox) {
        throw new Error(`Missing header checkbox.`);
      }

      userEvent.click(headerCheckbox);

      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({});
    });

    test('unselects item on click associated checkbox', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderTableLegend({
        selectedItems,
        onSelectedItemsChange: mockOnSelectedItemsChange,
      });

      const table = screen.getByRole('table');
      const rowCheckbox = within(table).getAllByRole('checkbox')[2];

      if (!rowCheckbox) {
        throw new Error(`Missing checkbox for row.`);
      }

      userEvent.click(rowCheckbox);

      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({
        one: true,
        three: true,
      });
    });
  });

  describe('when none selected', () => {
    const selectedItems = {};

    test('no checkboxes are checked', () => {
      renderTableLegend({
        selectedItems,
      });

      const table = screen.getByRole('table');
      const checkboxes = within(table).getAllByRole('checkbox');

      // Add 1 for the select all/none in the header row
      expect(checkboxes).toHaveLength(MOCK_ITEMS.length + 1);

      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    test('selects all on click header checkbox', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderTableLegend({
        selectedItems,
        onSelectedItemsChange: mockOnSelectedItemsChange,
      });

      const table = screen.getByRole('table');
      const headerCheckbox = within(table).getAllByRole('checkbox')[0];

      if (!headerCheckbox) {
        throw new Error(`Missing header checkbox.`);
      }

      userEvent.click(headerCheckbox);

      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({
        one: true,
        two: true,
        three: true,
      });
    });

    test('selects item on click associated checkbox', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderTableLegend({
        selectedItems,
        onSelectedItemsChange: mockOnSelectedItemsChange,
      });

      const table = screen.getByRole('table');
      const rowCheckbox = within(table).getAllByRole('checkbox')[2];

      if (!rowCheckbox) {
        throw new Error(`Missing checkbox for row.`);
      }

      userEvent.click(rowCheckbox);

      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({
        two: true,
      });
    });
  });

  describe('when some selected', () => {
    const selectedItems = {
      two: true,
    };

    test('selected items have checked checkboxes', () => {
      renderTableLegend({
        selectedItems,
      });

      const table = screen.getByRole('table');
      const checkboxes = within(table).getAllByRole('checkbox');

      // Add 1 for the select all/none in the header row
      expect(checkboxes).toHaveLength(MOCK_ITEMS.length + 1);

      // RTL's toBePartiallyChecked doesn't seem to catch how MUI checkboxes
      // handle indeterminate, so checking for what they do use.
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[0]?.getAttribute('data-indeterminate')).toBe('true');

      // Checkboxes are checked based on selected
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).toBeChecked();
      expect(checkboxes[3]).not.toBeChecked();
    });

    test('selects all on click header checkbox', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderTableLegend({
        selectedItems,
        onSelectedItemsChange: mockOnSelectedItemsChange,
      });

      const table = screen.getByRole('table');
      const headerCheckbox = within(table).getAllByRole('checkbox')[0];

      if (!headerCheckbox) {
        throw new Error(`Missing header checkbox.`);
      }

      userEvent.click(headerCheckbox);

      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({
        one: true,
        two: true,
        three: true,
      });
    });

    test('selects item on click associated checkbox for unselected item', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderTableLegend({
        selectedItems,
        onSelectedItemsChange: mockOnSelectedItemsChange,
      });

      const table = screen.getByRole('table');
      const rowCheckbox = within(table).getAllByRole('checkbox')[1];

      if (!rowCheckbox) {
        throw new Error(`Missing checkbox for row.`);
      }

      userEvent.click(rowCheckbox);

      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({
        one: true,
        two: true,
      });
    });

    test('imselects item on click associated checkbox for selected item', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderTableLegend({
        selectedItems,
        onSelectedItemsChange: mockOnSelectedItemsChange,
      });

      const table = screen.getByRole('table');
      const rowCheckbox = within(table).getAllByRole('checkbox')[2];

      if (!rowCheckbox) {
        throw new Error(`Missing checkbox for row.`);
      }

      userEvent.click(rowCheckbox);

      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({});
    });
  });
});
