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

export const legendPositions = ['Bottom', 'Right'] as const;

export type LegendPositions = typeof legendPositions[number];

export interface LegendOptions {
  position: LegendPositions;
}

export interface LegendItem {
  id: string;
  label: string;
  isSelected: boolean;
  color: string;
  onClick: MouseEventHandler<HTMLLIElement>;
}

export type LegendPositionConfig = {
  label: string;
};

export const LEGEND_POSITIONS_CONFIG: Readonly<Record<LegendPositions, LegendPositionConfig>> = {
  Bottom: { label: 'Bottom' },
  Right: { label: 'Right' },
};

export const DEFAULT_LEGEND: LegendOptions = {
  position: 'Bottom',
};

export function getLegendPosition(position?: LegendPositions) {
  if (position === undefined) {
    return DEFAULT_LEGEND.position;
  }
  if (isValidLegendPosition(position)) {
    return position;
  }
  return DEFAULT_LEGEND.position;
}

export function isValidLegendPosition(position: LegendPositions) {
  return (legendPositions as readonly string[]).includes(position);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateLegendSpec(legend?: any) {
  if (!legend) {
    return false;
  }
  if (!isValidLegendPosition(legend.position)) {
    return false;
  }
  return true;
}
