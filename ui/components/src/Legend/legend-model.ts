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

import { MouseEventHandler } from 'react';
import { LegendOptionsBase } from '@perses-dev/core';

// This file contains legend-related model code specific to the legend component.
// See the `core` package for common/shared legend model code and the
// `plugin-system` package for legend model code specific to panel plugin specs.

// Note: explicitly defining different options for the legend component and
// legend spec that extend from some common options, so we can allow the
// component and the spec to diverge in some upcoming work.
export type LegendComponentOptions = LegendOptionsBase;

export interface LegendItem {
  id: string;
  label: string;
  color: string;
  onClick?: MouseEventHandler<HTMLElement>;
}

/**
 * State of selected items in the legend.
 * - When "ALL", all legend items are selected, but not visually highlighted.
 * - Otherwise, it is a Record that associates legend item ids with a boolean
 *   value. When the associated entry for a legend item is `true`, that item
 *   will be treated as selected and visually highlighted.
 */
export type SelectedLegendItemState = Record<LegendItem['id'], boolean> | 'ALL';

export function isLegendItemVisuallySelected(item: LegendItem, selectedItems: SelectedLegendItemState) {
  // In the "ALL" case, technically all legend items are selected, but we do
  // not render them differently.
  return selectedItems !== 'ALL' && !!selectedItems[item.id];
}
