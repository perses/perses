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
  CALCULATIONS_CONFIG,
  CalculationType,
  LegendMode,
  LegendOptionsBase,
  LegendPositions,
  isValidLegendMode,
  isValidLegendPosition,
  LegendSize,
  isValidLegendSize,
} from '@perses-dev/core';

// This file contains legend-related model code specific to panel plugin specs.
// See the `core` package for common/shared legend model code and the
// `components` package for legend model code specific to the Legend component.

// Explicity listing the calculations we intend to use for legend values because
// we want them ordered in a specific way, and it may be possible in the future
// that we only use a subset of calculations for the legend because the calculations
// are also used by other features.
export const legendValues: CalculationType[] = [
  'Mean',
  'First',
  'FirstNumber',
  'Last',
  'LastNumber',
  'Min',
  'Max',
  'Sum',
];
export type LegendValue = (typeof legendValues)[number];

// Note: explicitly defining different options for the legend spec and
// legend component that extend from some common options, so we can allow the
// component and the spec to diverge in some upcoming work.
export interface LegendSpecOptions extends LegendOptionsBase {
  values?: LegendValue[];
}

export type LegendSingleSelectConfig = {
  label: string;
  description?: string;
};

export const LEGEND_POSITIONS_CONFIG: Readonly<Record<LegendPositions, LegendSingleSelectConfig>> = {
  Bottom: { label: 'Bottom' },
  Right: { label: 'Right' },
};

export const LEGEND_MODE_CONFIG: Readonly<Record<LegendMode, LegendSingleSelectConfig>> = {
  List: { label: 'List' },
  Table: { label: 'Table' },
};

export const LEGEND_SIZE_CONFIG: Readonly<Record<LegendSize, LegendSingleSelectConfig>> = {
  Small: { label: 'Small' },
  Medium: { label: 'Medium' },
};

export const LEGEND_VALUE_CONFIG = legendValues.reduce((config, value) => {
  config[value] = CALCULATIONS_CONFIG[value];

  return config;
}, {} as Partial<Record<LegendValue, LegendSingleSelectConfig>>);

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
  if (legend.size && !isValidLegendSize(legend.size)) {
    return false;
  }

  return true;
}
