// Copyright 2024 The Perses Authors
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

import { ModeOption, SortOption } from '@perses-dev/components';
import { CalculationType, DEFAULT_CALCULATION, Definition, FormatOptions } from '@perses-dev/core';
import { OptionsEditorProps, LegendSpecOptions } from '@perses-dev/plugin-system';

import {
  DEFAULT_CONNECT_NULLS,
  DEFAULT_POINT_RADIUS,
  StackOptions,
} from '../time-series-chart/time-series-chart-model';

export const DEFAULT_FORMAT: FormatOptions = { unit: 'decimal', shortValues: true };
export const DEFAULT_SORT: SortOption = 'desc';
export const DEFAULT_MODE: ModeOption = 'value';
export const DEFAULT_LINE_WIDTH = 1.25;
export const DEFAULT_AREA_OPACITY = 0;

export const VISUAL_CONFIG = {
  lineWidth: {
    label: 'Line Width',
    testId: 'slider-line-width',
    min: 0.25,
    max: 3,
    step: 0.25,
  },
  pointRadius: {
    label: 'Point Radius',
    testId: 'slider-point-radius',
    min: 0,
    max: 6,
    step: 0.25,
  },
  areaOpacity: {
    label: 'Area Opacity',
    testId: 'slider-area-opacity',
    min: 0,
    max: 1,
    step: 0.05,
  },
  stack: {
    label: 'Stack Series',
  },
  connectNulls: {
    label: 'Connect Nulls',
  },
};

export interface BarChartDefinition extends Definition<PieChartOptions> {
  kind: 'PieChart';
}
export const DEFAULT_VISUAL: PieChartVisualOptions = {
  lineWidth: DEFAULT_LINE_WIDTH,
  areaOpacity: DEFAULT_AREA_OPACITY,
  pointRadius: DEFAULT_POINT_RADIUS,
  connectNulls: DEFAULT_CONNECT_NULLS,
};
export interface PieChartPaletteOptions {
  mode: 'auto' | 'categorical';
}

export interface PieChartOptions {
  legend?: LegendSpecOptions;
  visual?: PieChartVisualOptions;
  querySettings?: QuerySettingsOptions[];
  calculation: CalculationType;
  radius: number;
  format?: FormatOptions;
  sort?: SortOption;
  mode?: ModeOption;
}

export interface QuerySettingsOptions {
  queryIndex: number;
  colorMode: 'fixed' | 'fixed-single';
  colorValue: string;
}
export type PieChartVisualOptions = {
  display?: 'line' | 'bar';
  lineWidth?: number;
  areaOpacity?: number;
  showPoints?: 'auto' | 'always';
  palette?: PieChartPaletteOptions;
  pointRadius?: number;
  stack?: StackOptions;
  connectNulls?: boolean;
};

export type PieChartOptionsEditorProps = OptionsEditorProps<PieChartOptions>;

export function createInitialPieChartOptions(): PieChartOptions {
  return {
    calculation: DEFAULT_CALCULATION,
    format: DEFAULT_FORMAT,
    radius: 50,
    sort: DEFAULT_SORT,
    mode: DEFAULT_MODE,
    visual: DEFAULT_VISUAL,
  };
}
