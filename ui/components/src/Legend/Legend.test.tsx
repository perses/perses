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
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { Legend, LegendProps } from './Legend';

const mockItems = [
  {
    id: '1',
    label: 'One',
    color: 'red',
  },
  {
    id: '2',
    label: 'Two',
    color: 'green',
  },
  {
    id: '3',
    label: 'Three',
    color: 'blue',
  },
];

type RenderLegendOpts = Partial<
  Pick<LegendProps, 'onSelectedItemsChange' | 'selectedItems' | 'onItemMouseOver' | 'onItemMouseOut'>
> & {
  position?: LegendProps['options']['position'];
};

const renderLegend = ({
  onSelectedItemsChange = jest.fn(),
  selectedItems = 'ALL',
  position = 'Bottom',
  onItemMouseOver = jest.fn(),
  onItemMouseOut = jest.fn(),
}: RenderLegendOpts = {}) => {
  return render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 100 }}>
      <Legend
        height={300}
        width={400}
        data={mockItems}
        options={{
          position: position,
        }}
        selectedItems={selectedItems}
        onSelectedItemsChange={onSelectedItemsChange}
        onItemMouseOver={onItemMouseOver}
        onItemMouseOut={onItemMouseOut}
      />
    </VirtuosoMockContext.Provider>
  );
};

describe('Legend', () => {
  describe.each(['Right', 'Bottom'] as const)('positioned %s', (position) => {
    test('renders items in a list', () => {
      renderLegend({ position });

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockItems.length);
      listItems.forEach((listItem, i) => {
        const mockItem = mockItems[i];
        if (!mockItem) {
          // This check exists to appease typescript.
          throw new Error('List item does not have matching item');
        }

        expect(listItem).toHaveTextContent(mockItem.label);
      });
    });

    test('highlights selected items when partial selection', () => {
      const selectedItems: LegendProps['selectedItems'] = { '1': true };
      renderLegend({
        position,
        selectedItems,
      });

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockItems.length);
      listItems.forEach((listItem, i) => {
        const mockItem = mockItems[i];
        if (!mockItem) {
          // This check exists to appease typescript.
          throw new Error('List item does not have matching item');
        }

        const shouldBeHighlighted = !!selectedItems[mockItem.id];

        expect(listItem).toHaveTextContent(mockItem.label);
        if (shouldBeHighlighted) {
          expect(listItem).toHaveClass('Mui-selected');
        } else {
          expect(listItem).not.toHaveClass('Mui-selected');
        }
      });
    });

    test('does not highlight selected items when select "ALL"', () => {
      renderLegend({
        position,
        selectedItems: 'ALL',
      });

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockItems.length);
      listItems.forEach((listItem, i) => {
        const mockItem = mockItems[i];
        if (!mockItem) {
          // This check exists to appease typescript.
          throw new Error('List item does not have matching item');
        }

        expect(listItem).toHaveTextContent(mockItem.label);
        expect(listItem).not.toHaveClass('Mui-selected');
      });
    });

    test('selects unselected item on click', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderLegend({
        onSelectedItemsChange: mockOnSelectedItemsChange,
        position,
      });

      const listItems = screen.getAllByRole('listitem');
      const itemToClick = listItems[1];
      if (!itemToClick) {
        throw new Error('Missing item to click');
      }

      userEvent.click(itemToClick);
      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({
        '2': true,
      });
    });

    test.each(['shiftKey', 'metaKey'])(`adds/removes selected items on click modified with %s`, (modifierKey) => {
      const mockOnSelectedItemsChange = jest.fn();
      renderLegend({
        onSelectedItemsChange: mockOnSelectedItemsChange,
        selectedItems: {
          '1': true,
          '2': true,
        },
        position,
      });

      const listItems = screen.getAllByRole('listitem');
      const unselectedItem = listItems[2];
      if (!unselectedItem) {
        throw new Error('Missing item to click');
      }

      userEvent.click(unselectedItem, { [modifierKey]: true });
      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({ '1': true, '2': true, '3': true });

      const selectedItem = listItems[0];
      if (!selectedItem) {
        throw new Error('Missing item to click');
      }
      userEvent.click(selectedItem, { [modifierKey]: true });
      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith({ '2': true });
    });

    test('reverts to select "ALL" on simple click of selected item', () => {
      const mockOnSelectedItemsChange = jest.fn();
      renderLegend({
        onSelectedItemsChange: mockOnSelectedItemsChange,
        selectedItems: {
          '2': true,
          '3': true,
        },
        position,
      });

      const listItems = screen.getAllByRole('listitem');
      const itemToClick = listItems[2];
      if (!itemToClick) {
        throw new Error('Missing item to click');
      }

      userEvent.click(itemToClick);
      expect(mockOnSelectedItemsChange).toHaveBeenCalledWith('ALL');
    });

    describe('on mouse over item', () => {
      test('calls `onItemMouseOver` with event and item information', () => {
        const mockOnItemMouseOver = jest.fn();
        renderLegend({
          onItemMouseOver: mockOnItemMouseOver,
          position,
        });

        const listItems = screen.getAllByRole('listitem');
        const itemToMouseOver = listItems[2];
        if (!itemToMouseOver) {
          throw new Error('Cannot find legend item');
        }

        userEvent.hover(itemToMouseOver);

        expect(mockOnItemMouseOver).toHaveBeenCalledWith(
          expect.objectContaining({
            target: itemToMouseOver,
          }),
          {
            id: '3',
            index: 2,
          }
        );
      });
    });

    describe('on mouse out item', () => {
      test('calls `onItemMouseOut` with event and item information', () => {
        const mockOnItemMouseOut = jest.fn();
        renderLegend({
          onItemMouseOut: mockOnItemMouseOut,
          position,
        });

        const listItems = screen.getAllByRole('listitem');
        const itemToMouseOut = listItems[1];
        if (!itemToMouseOut) {
          throw new Error('Cannot find legend item');
        }

        userEvent.unhover(itemToMouseOut);

        expect(mockOnItemMouseOut).toHaveBeenCalledWith(
          expect.objectContaining({
            target: itemToMouseOut,
          }),
          {
            id: '2',
            index: 1,
          }
        );
      });
    });
  });
});
