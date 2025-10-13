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

import { PanelGroupId } from './panels';

/**
 * Panel Group Item Layout ID type. String identifier for items within a panel group.
 */
export type PanelGroupItemLayoutId = string;

/**
 * Base layout properties for positioning and sizing items in a grid.
 * This is a framework-agnostic representation that can be used with various grid systems.
 */
export interface BaseLayout {
  /**
   * Item identifier
   */
  i: string;
  /**
   * X position in grid units
   */
  x: number;
  /**
   * Y position in grid units
   */
  y: number;
  /**
   * Width in grid units
   */
  w: number;
  /**
   * Height in grid units
   */
  h: number;
}

/**
 * Layout information for an item within a panel group.
 * Extends BaseLayout with a typed identifier.
 */
export interface PanelGroupItemLayout extends BaseLayout {
  i: PanelGroupItemLayoutId;
}

/**
 * Uniquely identifies an item in a PanelGroup.
 */
export interface PanelGroupItemId {
  panelGroupId: PanelGroupId;
  panelGroupItemLayoutId: PanelGroupItemLayoutId;
  repeatVariable?: [string, string]; // Optional, used for repeated panel groups. Variable name and value.
}

/**
 * Definition of a panel group, containing layout and panel information.
 */
export interface PanelGroupDefinition {
  id: PanelGroupId;
  isCollapsed: boolean;
  title?: string;
  repeatedOriginId?: PanelGroupId; // ID of the original panel group from which this repeated group is derived
  repeatVariable?: string; // Optional, used for repeated panel groups
  itemLayouts: PanelGroupItemLayout[];
  itemPanelKeys: Record<PanelGroupItemLayoutId, string>;
}

/**
 * Check if two PanelGroupItemId are equal
 */
export function isPanelGroupItemIdEqual(a?: PanelGroupItemId, b?: PanelGroupItemId): boolean {
  return a?.panelGroupId === b?.panelGroupId && a?.panelGroupItemLayoutId === b?.panelGroupItemLayoutId;
}
