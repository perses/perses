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
import { combineSx } from '../utils';
import { LegendColorBadge } from './LegendColorBadge';
import { LegendItem } from './legend-model';

export type LegendItemEventOpts = {
  /**
   * Unique identifier for the legend item.
   */
  id: string;

  /**
   * Index of the row in the original data.
   */
  index: number;
};

export interface ListLegendItemProps extends Omit<ListItemProps<'div'>, 'onClick' | 'onMouseOver' | 'onMouseOut'> {
  item: LegendItem;

  index: number;

  /**
   * When true, the item is rendered differently to visually communicate it is
   * selected.
   */
  isVisuallySelected?: boolean;

  onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, seriesId: string) => void;

  onMouseOver?: (e: React.MouseEvent, opts: LegendItemEventOpts) => void;
  onMouseOut?: (e: React.MouseEvent, opts: LegendItemEventOpts) => void;

  /**
   * When `true`, will keep labels to a single line with overflow ellipsized. The
   * full content will be shown on hover.
   *
   * When `false` or unset, will show the full label.
   */
  truncateLabel?: boolean;
}

const ListLegendItemBase = forwardRef<HTMLDivElement, ListLegendItemProps>(function ListLegendItem(
  { item, sx, truncateLabel, onClick, isVisuallySelected, onMouseOver, onMouseOut, index, ...others },
  ref
) {
  const [noWrap, setNoWrap] = useState(truncateLabel);

  function handleTextMouseOver() {
    if (truncateLabel) {
      setNoWrap(false);
    }
  }

  function handleTextMouseOut() {
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
      onMouseOver={(e: React.MouseEvent) => onMouseOver?.(e, { id: item.id, index })}
      onMouseOut={(e: React.MouseEvent) => onMouseOut?.(e, { id: item.id, index })}
      selected={isVisuallySelected}
      ref={ref}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <LegendColorBadge color={item.color} />
      </Box>
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{ noWrap: noWrap }}
        onMouseOver={handleTextMouseOver}
        onMouseOut={handleTextMouseOut}
      ></ListItemText>
    </ListItem>
  );
});

export const ListLegendItem = React.memo(ListLegendItemBase);
