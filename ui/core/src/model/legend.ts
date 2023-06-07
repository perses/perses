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

// This file contains common/shared legend model code.
// See the `components` package for legend model code specific to the Legend
// component and the  `plugin-system` package for legend model code specific to
// panel plugin specs.

export const legendPositions = ['Bottom', 'Right'] as const;
export type LegendPositions = (typeof legendPositions)[number];

export const legendModes = ['List', 'Table'] as const;
export type LegendMode = (typeof legendModes)[number];

// Common legend options used across some UI components and panel specifications
export interface LegendOptionsBase {
  position: LegendPositions;
  mode?: LegendMode;
}

export function isValidLegendPosition(position: LegendPositions) {
  return (legendPositions as readonly string[]).includes(position);
}

export function isValidLegendMode(mode: LegendMode) {
  return (legendModes as readonly string[]).includes(mode);
}

export const DEFAULT_LEGEND: Required<LegendOptionsBase> = {
  position: 'Bottom',
  mode: 'List',
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

export function getLegendMode(mode?: LegendMode) {
  if (!mode || !isValidLegendMode(mode)) {
    return DEFAULT_LEGEND.mode;
  }

  return mode;
}
