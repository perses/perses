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

import React, { forwardRef, useState } from 'react';
import { Box, ListItemText, ListItem, ListItemProps } from '@mui/material';
import { LegendItem } from '../model';
import { combineSx } from '../utils';
import { LegendColorBadge } from './LegendColorBadge';

interface ListLegendItemProps extends ListItemProps<'div'> {
  item: LegendItem;

  /**
   * When `true`, will keep labels to a single line with overflow ellipsized. The
   * full content will be shown on hover.
   *
   * When `false` or unset, will show the full label.
   */
  truncateLabel?: boolean;
}

const ListLegendItemBase = forwardRef<HTMLDivElement, ListLegendItemProps>(function ListLegendItem(
  { item, sx, truncateLabel, ...others },
  ref
) {
  const [noWrap, setNoWrap] = useState(truncateLabel);

  function handleMouseOver() {
    if (truncateLabel) {
      setNoWrap(false);
    }
  }

  function handleMouseOut() {
    if (truncateLabel) {
      setNoWrap(true);
    }
  }

  return (
    <ListItem
      {...others}
      component="div"
      role="listitem"
      sx={combineSx(
        {
          padding: 0,
          cursor: 'pointer',
        },
        sx
      )}
      dense={true}
      key={item.id}
      onClick={item.onClick}
      selected={item.isSelected}
      ref={ref}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <LegendColorBadge color={item.color} />
      </Box>
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{ noWrap: noWrap }}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      ></ListItemText>
    </ListItem>
  );
});

export const ListLegendItem = React.memo(ListLegendItemBase);
