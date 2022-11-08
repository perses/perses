// Copyright 2022 The Perses Authors
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

import { List } from '@mui/material';
import { LegendItem } from '../model';
import { ListLegendItem } from './ListLegendItem';

interface ListLegendProps {
  items: LegendItem[];
}

/**
 * ListLegend is used when legend.position is 'right' since legend items are stacked
 */
export function ListLegend({ items }: ListLegendProps) {
  // show full labels on hover when there are many total series
  const truncateLabels = items.length > 5;
  return (
    <List>
      {items.map((item) => (
        <ListLegendItem
          key={item.id}
          item={item}
          sx={{
            width: 190,
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
            overflow: truncateLabels ? 'hidden' : 'visible',
            whiteSpace: truncateLabels ? 'nowrap' : 'normal',
            // TODO: add optional hover effect to show unformatted label
            '&:hover': {
              overflow: 'visible',
              whiteSpace: 'normal', // this allow you to see the full label on hover
            },
          }}
        />
      ))}
    </List>
  );
}
