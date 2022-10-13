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
import { ListLegendItem } from './ListLegendItem';

interface ListLegendProps {
  height: number;
  width: number;
  items: ListLegendItem[];
}

export function ListLegend({ items, height, width }: ListLegendProps) {
  return (
    <List
      sx={{
        height: height,
        width: width,
        overflow: 'auto',
      }}
    >
      {items.map((item) => (
        <ListLegendItem key={item.id} item={item} />
      ))}
    </List>
  );
}
