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

import {
  LegendMode,
  LegendOptionsBase,
  LegendPositions,
  isValidLegendMode,
  isValidLegendPosition,
} from '@perses-dev/core';

// This file contains legend-related model code specific to panel plugin specs.
// See the `core` package for common/shared legend model code and the
// `components` package for legend model code specific to the Legend component.

// Note: explicitly defining different options for the legend spec and
// legend component that extend from some common options, so we can allow the
// component and the spec to diverge in some upcoming work.
export type LegendSpecOptions = LegendOptionsBase;

export type LegendSingleSelectConfig = {
  label: string;
};

export const LEGEND_POSITIONS_CONFIG: Readonly<Record<LegendPositions, LegendSingleSelectConfig>> = {
  Bottom: { label: 'Bottom' },
  Right: { label: 'Right' },
};

export const LEGEND_MODE_CONFIG: Readonly<Record<LegendMode, LegendSingleSelectConfig>> = {
  List: { label: 'List' },
  Table: { label: 'Table' },
};

export function validateLegendSpec(legend?: LegendOptionsBase) {
  if (legend === undefined) {
    // undefined is valid since this is how legend is hidden by default
    return true;
  }
  if (!isValidLegendPosition(legend.position)) {
    return false;
  }
  if (legend.mode && !isValidLegendMode(legend.mode)) {
    return false;
  }

  return true;
}
