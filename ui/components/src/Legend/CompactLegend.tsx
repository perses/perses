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

import { Box } from '@mui/material';
import { LegendItem } from '../model';
import { ListLegendItem } from './ListLegendItem';

interface CompactLegendProps {
  height: number;
  items: LegendItem[];
}

/**
 * CompactLegend is default and used when legend items need to show side by side
 * which corresponds to when legend.position is `bottom`
 */
export function CompactLegend({ height, items }: CompactLegendProps) {
  return (
    <Box component="ul" sx={{ width: '100%', height, padding: [0, 1, 0, 0], overflowY: 'scroll', margin: 0 }}>
      {items.map((item) => (
        <ListLegendItem
          key={item.id}
          item={item}
          sx={{
            width: 'auto',
            float: 'left',
            paddingRight: 1.5,
          }}
        />
      ))}
    </Box>
  );
}
