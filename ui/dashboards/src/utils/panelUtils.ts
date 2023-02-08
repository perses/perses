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

import { PanelDefinition } from '@perses-dev/core';
import { PanelGroupDefinition, PanelGroupItemLayout } from '../context';
import { GRID_LAYOUT_SMALL_BREAKPOINT, GRID_LAYOUT_COLS } from '../constants';

// Given a PanelGroup, will find the Y coordinate for adding a new row to the grid, taking into account the items present
export function getYForNewRow(group: PanelGroupDefinition) {
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

  const aboveInsertRow: PanelGroupItemLayout[] = [];
  const insertRow: PanelGroupItemLayout[] = [];
  const belowInsertRow: PanelGroupItemLayout[] = [];

  // Organize layouts based on vertical relation to the item being inserted
  // after.
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
  }

  if (insertAfterIndex >= 0) {
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

  // Inserted the new item below the original and shift the items below the
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
 * Get a valid panel key, where a valid key:
 * - does not include invalid characters
 * - is unique
 */
export function getValidPanelKey(panelKey: string, panels: Record<string, PanelDefinition>): string {
  const uniquePanelKeys = getUniquePanelKeys(panels);
  let normalizedPanelKey = getPanelKeyParts(removeWhiteSpaces(panelKey)).name;

  const matchingKey = uniquePanelKeys[normalizedPanelKey];
  if (typeof matchingKey === 'number') {
    normalizedPanelKey += `-${matchingKey + 1}`;
  }
  return normalizedPanelKey;
}

type PanelKeyParts = {
  name: string;
  number?: number;
};

const removeWhiteSpaces = (str: string) => {
  return str.replace(/\s+/g, '');
};

/**
 * Breaks the specified panel key into the name and the optional `-number` used
 * for deduping panels with the same name.
 */
function getPanelKeyParts(panelKey: string): PanelKeyParts {
  const parts = panelKey.match(/(.+)-([0-9]+)/);
  if (parts && parts[1] && parts[2]) {
    return {
      name: parts[1],
      number: parseInt(parts[2], 10),
    };
  }

  return {
    name: panelKey,
  };
}

// Find all the unique panel keys and the largest number used for each.
// ex: cpu, cpu-1, cpu-2 count as the same panel key since these panels have the same name
function getUniquePanelKeys(panels: Record<string, PanelDefinition>): Record<string, number> {
  const uniquePanelKeys: Record<string, number> = {};
  Object.keys(panels).forEach((panelKey) => {
    const { name, number } = getPanelKeyParts(panelKey);
    if (uniquePanelKeys[name] === undefined) {
      uniquePanelKeys[name] = 0;
    }
    const currentValue = uniquePanelKeys[name];
    if (typeof currentValue === 'number' && number) {
      // Check for the maximum value because we cannot rely on a sequential
      // set of numbers when panels are modified.
      uniquePanelKeys[name] = Math.max(currentValue, number);
    }
  });
  return uniquePanelKeys;
}
