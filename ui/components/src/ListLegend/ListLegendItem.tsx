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

import React from 'react';
import { Box, ListItemText, ListItem, BoxProps } from '@mui/material';
import { combineSx } from '../utils';
interface ListLegendItemProps {
  item: ListLegendItem;
}

export interface ListLegendItem {
  id: string;
  label: string;
  isSelected: boolean;
  color: string;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
}

export const ListLegendItem = React.memo(function ListLegendItem({ item }: ListLegendItemProps) {
  return (
    <ListItem
      dense={true}
      sx={{
        display: 'flex',
        paddingTop: 0,
        paddingBottom: 0,
        cursor: 'pointer',
      }}
      key={item.id}
      onClick={item.onClick}
      selected={item.isSelected}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <LegendColorBadge color={item.color} />
      </Box>
      <ListItemText primary={item.label}></ListItemText>
    </ListItem>
  );
});

export interface LegendColorBadgeProps extends BoxProps<'div'> {
  color: string;
}

export const LegendColorBadge = React.memo(function LegendColorBadge({ color, sx, ...others }: LegendColorBadgeProps) {
  return (
    <Box
      {...others}
      sx={combineSx(
        {
          height: 4,
          width: 16,
          margin: (theme) => theme.spacing(0.5),
        },
        sx
      )}
      style={{ ...others.style, backgroundColor: color }}
    />
  );
});
