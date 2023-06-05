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
import { produce } from 'immer';
import { ReactNode } from 'react';
import { getLegendMode } from '@perses-dev/core';
import { ListLegend } from './ListLegend';
import { CompactLegend } from './CompactLegend';
import { TableLegend } from './TableLegend';
import { LegendItem, LegendComponentOptions, SelectedLegendItemState } from './legend-model';

export interface LegendProps {
  width: number;
  height: number;
  data: LegendItem[];
  options: LegendComponentOptions;

  /**
   * State of selected items in the legend.
   *
   * Selected legend item state is a controlled value that should be managed using a
   * combination of this prop and `onSelectedChange`.
   */
  selectedItems: SelectedLegendItemState;

  /**
   * Callback fired when the selected items in the legend changes.
   */
  onSelectedItemsChange: (newSelected: SelectedLegendItemState) => void;
}

// When the number of items to display is above this number, it is likely to
// cause performance issues in the browser. The legend will be displayed in a
// format (list) that allows for virtualization to minimize the performance impact.
// Set this number based on testing, but it may need to be tuned a bit on the
// future as people test this out on different machines.
const NEED_VIRTUALIZATION_LIMIT = 500;

export function Legend({ width, height, options, data, selectedItems, onSelectedItemsChange }: LegendProps) {
  const onLegendItemClick = (e: React.MouseEvent<HTMLElement, MouseEvent>, seriesId: string) => {
    const isModifiedClick = e.metaKey || e.shiftKey;

    const newSelected = produce(selectedItems, (draft) => {
      if (draft === 'ALL') {
        return {
          [seriesId]: true,
        };
      }

      const isSelected = !!draft[seriesId];

      // Clicks with modifier key can select multiple items.
      if (isModifiedClick) {
        if (isSelected) {
          // Modified click on already selected item. Remove that item.
          delete draft[seriesId];
        } else {
          // Modified click on not-selected item. Add it.
          draft[seriesId] = true;
        }
        return draft;
      }

      if (isSelected) {
        // Clicked item was already selected. Unselect it and return to
        // ALL state.
        return 'ALL' as const;
      }

      // Select clicked item.
      return { [seriesId]: true };
    });
    onSelectedItemsChange(newSelected);
  };

  const mode = getLegendMode(options.mode);

  // The bottom legend is displayed as a list when the number of items is too
  // large and requires virtualization. Otherwise, it is rendered more compactly.
  // We do not need this check for the right-side legend because it is always
  // a virtualized list.
  const needsVirtualization = data.length >= NEED_VIRTUALIZATION_LIMIT;

  const commonLegendProps = {
    height,
    items: data,
    selectedItems,
    onLegendItemClick,
  };

  let legendContent: ReactNode;
  if (mode === 'Table') {
    legendContent = <TableLegend {...commonLegendProps} onSelectedItemsChange={onSelectedItemsChange} width={width} />;
  } else if (options.position === 'Right' || needsVirtualization) {
    legendContent = <ListLegend {...commonLegendProps} width={width} onLegendItemClick={onLegendItemClick} />;
  } else {
    legendContent = <CompactLegend {...commonLegendProps} onLegendItemClick={onLegendItemClick} />;
  }

  if (options.position === 'Right') {
    return (
      <Box
        sx={{
          width: width,
          height: height,
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      >
        {legendContent}
      </Box>
    );
  }

  // Position bottom
  return (
    <Box
      sx={{
        width: width,
        height: height,
        position: 'absolute',
        bottom: 0,
      }}
    >
      {legendContent}
    </Box>
  );
}
