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

import { useTheme } from '@mui/material';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useRef, useEffect, forwardRef } from 'react';
import { LegendItem } from '../model';
import { ListLegendItem } from './ListLegendItem';

interface ListLegendProps {
  items: LegendItem[];
}

// Default height used to start while virtualizing the list before a true
// height is determined.
const DEFAULT_ROW_HEIGHT = 24;

/**
 * ListLegend is used when legend.position is 'right' since legend items are
 * stacked. It is also used for `bottom` positioned legends when there are a
 * large number of items because it is virtualized and easier to visually scan
 * large numbers of items when there is a single item per row.
 */
export function ListLegend({ items }: ListLegendProps) {
  // Storing a ref to the react-window `VariableSizeList`, so we can call
  // `resetAfterIndex` to resize the list after mouseover/out events to account
  // for the change in list items on hover.
  const listRef = useRef<VariableSizeList>(null);
  // Storing row heights, so we can use dynamic heights, which enables the
  // user the hover to show the full label, while still having a virtualized
  // list.
  const rowHeights = useRef<Record<number, number>>({});

  const theme = useTheme();
  // Padding value used throughout to adjust the react-window virtual layouts
  // to simulate padding per the guidance from:
  // https://github.com/bvaughn/react-window#can-i-add-padding-to-the-top-and-bottom-of-a-list
  const LIST_PADDING = parseInt(theme.spacing(1), 10);

  // show full labels on hover when there are many total series
  const truncateLabels = items.length > 5;

  // Gets the row height for a given item to enable the virtualized list to
  // render the row properly.
  function getRowHeight(index: number) {
    const currentHeight = rowHeights.current[index];
    return currentHeight ?? DEFAULT_ROW_HEIGHT;
  }

  // Set the height for a given item to enable the virtualized list to
  // adjust to size changes.
  function setRowHeight(index: number, size: number) {
    // Tell the virtualized list that items changed size and need to be
    // re-evaluated.
    listRef.current?.resetAfterIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  }

  // Renderer for virtualized rows in `VariableSizeList`.
  function ListLegendRow({ index, style }: ListChildComponentProps) {
    // Storing a ref to the row's `ListLegendItem`, so we can get the "real"
    // height and adjust the height of the row based on it, enabling the dynamic
    // heights on hover.
    const rowRef = useRef<HTMLDivElement | null>(null);

    // Adjust row heights when the row being rendered changes.
    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }, [rowRef, index]);

    // Handle size changes from hover on mouseover/mouseout
    function handleMouseOverOut() {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }

    const item = items[index];

    if (!item) {
      // This shouldn't happen if configured correctly, but covering
      // the case to appease the type checking and to cover any edge
      // cases.
      return null;
    }

    const originalTop = parseFloat(`${style.top}`);

    return (
      <div
        style={{
          ...style,
          // Adjust the top position to simulate top padding on the list.
          top: `${originalTop + LIST_PADDING}px`,
          paddingRight: `${LIST_PADDING}px`,
        }}
      >
        <ListLegendItem
          ref={rowRef}
          key={item.id}
          item={item}
          onMouseOver={handleMouseOverOut}
          onMouseOut={handleMouseOverOut}
          sx={{
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
      </div>
    );
  }

  // Renderer for the inner container element of the `VariableSizeList` used
  // to adjust styles to simulate padding on the list per:
  // https://github.com/bvaughn/react-window#can-i-add-padding-to-the-top-and-bottom-of-a-list
  const InnerElementType = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(function InnerElementType(
    { style, ...rest },
    ref
  ) {
    const originalHeight = style?.height ? parseFloat(`${style?.height}`) : 0;

    return (
      <div
        ref={ref}
        role="list"
        style={{
          ...style,
          // Adjust height to account for simulated padding.
          height: `${originalHeight + LIST_PADDING * 2}px`,
        }}
        {...rest}
      />
    );
  });

  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <VariableSizeList
            height={height ?? 0}
            width={width ?? 0}
            itemCount={items.length}
            itemSize={getRowHeight}
            innerElementType={InnerElementType}
            ref={listRef}
          >
            {ListLegendRow}
          </VariableSizeList>
        );
      }}
    </AutoSizer>
  );
}
