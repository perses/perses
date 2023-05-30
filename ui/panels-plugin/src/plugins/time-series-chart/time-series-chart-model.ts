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

import { Definition, ThresholdOptions } from '@perses-dev/core';
import { UnitOptions, LegendOptions } from '@perses-dev/components';
import { OptionsEditorProps } from '@perses-dev/plugin-system';

/**
 * The schema for a TimeSeriesChart panel.
 */
export interface TimeSeriesChartDefinition extends Definition<TimeSeriesChartOptions> {
  kind: 'TimeSeriesChart';
}

/**
 * The Options object supported by the TimeSeriesChartPanel plugin.
 */
export interface TimeSeriesChartOptions {
  legend?: LegendOptions;
  y_axis?: TimeSeriesChartYAxisOptions;
  thresholds?: ThresholdOptions;
  visual?: TimeSeriesChartVisualOptions;
}

export type TimeSeriesChartOptionsEditorProps = OptionsEditorProps<TimeSeriesChartOptions>;

export interface TimeSeriesChartYAxisOptions {
  show?: boolean;
  label?: string;
  unit?: UnitOptions;
  min?: number;
  max?: number;
}

export interface TimeSeriesChartPaletteOptions {
  kind: 'Auto' | 'Categorical';
  // colors: string []; // TODO: add colors to override ECharts theme
}

export type TimeSeriesChartVisualOptions = {
  line_width?: number;
  area_opacity?: number;
  show_points?: 'Auto' | 'Always';
  palette?: TimeSeriesChartPaletteOptions;
  point_radius?: number;
  stack?: StackOptions;
  connect_nulls?: boolean;
};

export const DEFAULT_UNIT: UnitOptions = {
  kind: 'Decimal',
  abbreviate: true,
};

export const DEFAULT_Y_AXIS: TimeSeriesChartYAxisOptions = {
  show: true,
  label: '',
  unit: DEFAULT_UNIT,
  min: undefined,
  max: undefined,
};

export const Y_AXIS_CONFIG = {
  show: { label: 'Show' },
  label: { label: 'Label' },
  unit: { label: 'Unit' },
  min: { label: 'Min' },
  max: { label: 'Max' },
};

export const DEFAULT_LINE_WIDTH = 1.5;
export const DEFAULT_AREA_OPACITY = 0;

// How much larger datapoint symbols are than line width, also applied in VisualOptionsEditor.
export const POINT_SIZE_OFFSET = 1.5;
export const DEFAULT_POINT_RADIUS = DEFAULT_LINE_WIDTH + POINT_SIZE_OFFSET;

export const DEFAULT_CONNECT_NULLS = false;

export const DEFAULT_VISUAL: TimeSeriesChartVisualOptions = {
  line_width: DEFAULT_LINE_WIDTH,
  area_opacity: DEFAULT_AREA_OPACITY,
  point_radius: DEFAULT_POINT_RADIUS,
  connect_nulls: DEFAULT_CONNECT_NULLS,
};

export const VISUAL_CONFIG = {
  line_width: {
    label: 'Line Width',
    testId: 'slider-line-width',
    min: 0.25,
    max: 3,
    step: 0.25,
  },
  point_radius: {
    label: 'Point Radius',
    testId: 'slider-point-radius',
    min: 0,
    max: 6,
    step: 0.25,
  },
  area_opacity: {
    label: 'Area Opacity',
    testId: 'slider-area-opacity',
    min: 0,
    max: 1,
    step: 0.05,
  },
  stack: {
    label: 'Stack Series',
  },
  connect_nulls: {
    label: 'Connect Nulls',
  },
};

// None is equivalent to undefined since stack is optional
export type StackOptions = 'None' | 'All' | 'Percent'; // TODO: add Percent option support

export const STACK_CONFIG = {
  None: { label: 'None' },
  All: { label: 'All' },
  Percent: { label: 'Percent' }, // temporarily disabled
};

export const STACK_OPTIONS = Object.entries(STACK_CONFIG).map(([id, config]) => {
  return {
    id: id as StackOptions,
    ...config,
  };
});

export const PANEL_HEIGHT_LG_BREAKPOINT = 300;
export const LEGEND_HEIGHT_SM = 40;
export const LEGEND_HEIGHT_LG = 100;

// Both of these constants help produce a value that is LESS THAN the initial value.
// For positive values, we multiply by a number less than 1 to get this outcome.
// For negative values, we multiply to a number greater than 1 to get this outcome.
export const POSITIVE_MIN_VALUE_MULTIPLIER = 0.8;
export const NEGATIVE_MIN_VALUE_MULTIPLIER = 1.2;

/**
 * Creates an initial/empty options object for the TimeSeriesChartPanel.
 */
export function createInitialTimeSeriesChartOptions(): TimeSeriesChartOptions {
  return {};
}
