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

export interface ListLegendItemProps extends Omit<ListItemProps<'div'>, 'onClick'> {
  item: LegendItem;

  /**
   * When true, the item is rendered differently to visually communicate it is
   * selected.
   */
  isVisuallySelected?: boolean;

  onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, seriesId: string) => void;

  /**
   * When `true`, will keep labels to a single line with overflow ellipsized. The
   * full content will be shown on hover.
   *
   * When `false` or unset, will show the full label.
   */
  truncateLabel?: boolean;
}

const ListLegendItemBase = forwardRef<HTMLDivElement, ListLegendItemProps>(function ListLegendItem(
  { item, sx, truncateLabel, onClick, isVisuallySelected, ...others },
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

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    onClick(e, item.id);
    item.onClick?.(e);
  };

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
      onClick={handleClick}
      selected={isVisuallySelected}
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
