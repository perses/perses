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
import { PanelGroupDefinition } from '../context';

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

/**
 * Get a valid panel key, where a valid key:
 * - does not include invalid characters
 * - is unique
 */
export function getValidPanelKey(panelKey: string, panels: Record<string, PanelDefinition>): string {
  const uniquePanelKeys = getUniquePanelKeys(panels);
  let normalizedPanelKey = getPanelKeyParts(removeWhiteSpacesAndSpecialCharacters(panelKey)).name;

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

const removeWhiteSpacesAndSpecialCharacters = (str: string) => {
  return str.replace(/\s+/g, '');
};

/**
 * Breaks the specified panel key into the name and the optional `-number` used
 * for deduping panels with the name name.
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
