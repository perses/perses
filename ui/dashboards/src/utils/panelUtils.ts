// Copyright 2025 The Perses Authors
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

import { PanelGroupDefinition, PanelGroupItemLayout } from '@perses-dev/core';
import { GRID_LAYOUT_SMALL_BREAKPOINT, GRID_LAYOUT_COLS } from '../constants';

// Given a PanelGroup, will find the Y coordinate for adding a new row to the grid, taking into account the items present
export function getYForNewRow(group: PanelGroupDefinition): number {
  let newRowY = 0;
  for (const layout of group.itemLayouts) {
    const itemMaxY = layout.y + layout.h;
    if (itemMaxY > newRowY) {
      newRowY = itemMaxY;
    }
  }
  return newRowY;
}

type PanelGroupItemBounds = {
  /**
   * Left horizontal position.
   */
  x1: number;
  /**
   * Right horizontal position.
   */
  x2: number;
  /**
   * Top vertical position.
   */
  y1: number;
  /**
   * Bottom vertical position
   */
  y2: number;
};

function getPanelBounds({ x, y, w, h }: PanelGroupItemLayout): PanelGroupItemBounds {
  return {
    x1: x,
    x2: x + w,
    y1: y,
    y2: y + h,
  };
}

export type UnpositionedPanelGroupItemLayout = Omit<PanelGroupItemLayout, 'x' | 'y'>;

/**
 * Inserts a new panel into the layout with placement determined by a specified
 * reference panel. The new panel is placed:
 * - To the right of the reference panel if there is space available without
 *   moving other panels.
 * - Otherwise, directly below the reference panel. If other panels are below
 *   this location, they will also shift downward because the grid uses
 *   vertical-based compacting.
 *
 * @param newLayout - Layout for new panel to insert into the grid.
 * @param referenceLayout - Layout for reference panel used to determine the
 *   placement of the new panel.
 * @param itemLayouts - Full grid layout.
 * @returns - Item layouts modified to insert the new panel.
 */
export function insertPanelInLayout(
  newLayout: UnpositionedPanelGroupItemLayout,
  referenceLayout: PanelGroupItemLayout,
  itemLayouts: PanelGroupItemLayout[]
): PanelGroupItemLayout[] {
  const MAX_LAYOUT_WIDTH = GRID_LAYOUT_COLS[GRID_LAYOUT_SMALL_BREAKPOINT];

  const referenceBounds = getPanelBounds(referenceLayout);

  // Organize layouts based on vertical relation to the item being inserted
  // after.
  const aboveInsertRow: PanelGroupItemLayout[] = [];
  const insertRow: PanelGroupItemLayout[] = [];
  const belowInsertRow: PanelGroupItemLayout[] = [];
  itemLayouts.forEach((itemLayout) => {
    const itemBounds = getPanelBounds(itemLayout);

    if (itemBounds.y2 <= referenceBounds.y1) {
      aboveInsertRow.push(itemLayout);
    } else if (itemBounds.y1 >= referenceBounds.y2) {
      belowInsertRow.push(itemLayout);
    } else {
      insertRow.push(itemLayout);
    }
  });

  // Cannot safely assume that the order of item layouts array is strictly
  // left to right. Sorting the row by horizontal position to more easily find
  // gaps.
  insertRow.sort((a, b) => a.x - b.x);
  const insertAfterIndex = insertRow.findIndex((item) => item.i === referenceLayout.i);

  if (insertAfterIndex === insertRow.length - 1) {
    // Insert to the right when space is available and the reference is the last
    // item in the row.
    if (referenceBounds.x2 + newLayout.w <= MAX_LAYOUT_WIDTH) {
      return [
        ...aboveInsertRow,
        ...insertRow,
        {
          ...newLayout,
          x: referenceBounds.x2,
          y: referenceBounds.y1,
        },
        ...belowInsertRow,
      ];
    }
  } else if (insertAfterIndex >= 0) {
    const nextItem = insertRow[insertAfterIndex + 1];

    if (nextItem && getPanelBounds(nextItem).x1 - referenceBounds.x2 >= newLayout.w) {
      // Insert to the right when space is available between the reference and
      // the next item in the row.
      insertRow.splice(insertAfterIndex + 1, 0, {
        ...newLayout,
        x: referenceBounds.x2,
        y: referenceBounds.y1,
      });

      return [...aboveInsertRow, ...insertRow, ...belowInsertRow];
    }
  }

  // Insert the new item below the original and shift the items below the
  // row where the reference is located.
  return [
    ...aboveInsertRow,
    ...insertRow,
    { x: referenceBounds.x1, y: referenceBounds.y2, ...newLayout },
    ...belowInsertRow.map((itemLayout) => {
      // Note: the grid will not necessarily display all of these items shifted
      // all the way down because of vertical compacting, but shifing their
      // y position ensures the new item gets vertical precedence over items
      // below it in that compacting.
      return { ...itemLayout, y: itemLayout.y + newLayout.h };
    }),
  ];
}

/**
 * This function generates a unique panel key based on UUID or timestamp and random suffix.
 */
export const generatePanelKey = (): string => {
  /* crypto.randomUUID() is only available in secure contexts (HTTPS), */
  if (window.isSecureContext) {
    return crypto.randomUUID().replaceAll('-', '');
  }
  const timestamp = String(Date.now());
  const randomSuffix = Math.random().toString(36).substring(2);
  return `${timestamp}${randomSuffix}`;
};
