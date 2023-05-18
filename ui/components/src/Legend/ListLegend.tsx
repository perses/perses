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

import { useTheme, Box } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';
import { LegendItem, SelectedLegendItemState, isLegendItemHighlighted } from '../model';
import { ListLegendItem, ListLegendItemProps } from './ListLegendItem';

export interface ListLegendProps {
  items: LegendItem[];
  height: number;
  width: number;
  selectedItems: SelectedLegendItemState;
  onLegendItemClick: ListLegendItemProps['onClick'];
}

/**
 * ListLegend is used when legend.position is 'right' since legend items are
 * stacked. It is also used for `bottom` positioned legends when there are a
 * large number of items because it is virtualized and easier to visually scan
 * large numbers of items when there is a single item per row.
 */
export function ListLegend({ items, height, width, selectedItems, onLegendItemClick }: ListLegendProps) {
  const theme = useTheme();
  // Padding value used in the react virtuoso header/footer components to
  // simulate top/bottom padding based on recommendation in this
  // issue.
  // https://github.com/petyosi/react-virtuoso/issues/238
  const LIST_PADDING = parseInt(theme.spacing(1), 10);
  const mockPadding = <Box sx={{ width: '100%', height: `${LIST_PADDING}px` }}></Box>;

  // show full labels on hover when there are many total series
  const truncateLabels = items.length > 5;

  return (
    <Virtuoso
      style={{ height, width }}
      data={items}
      itemContent={(index, item) => {
        return (
          <ListLegendItem
            key={item.id}
            item={item}
            truncateLabel={truncateLabels}
            isHighlighted={isLegendItemHighlighted(item, selectedItems)}
            onClick={onLegendItemClick}
            sx={{
              // Having an explicit width is important for the ellipsizing to
              // work correctly. Subtract padding to simulate padding.
              width: width - LIST_PADDING,
              wordBreak: 'break-word',
              overflow: 'hidden',
            }}
          />
        );
      }}
      role="list"
      components={{
        Header: () => {
          return mockPadding;
        },
        Footer: () => {
          return mockPadding;
        },
      }}
    />
  );
}
