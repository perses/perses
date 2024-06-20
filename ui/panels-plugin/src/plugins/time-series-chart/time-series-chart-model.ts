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

import { Definition, ThresholdOptions, FormatOptions } from '@perses-dev/core';
import { OptionsEditorProps, LegendSpecOptions } from '@perses-dev/plugin-system';

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
  legend?: LegendSpecOptions;
  yAxis?: TimeSeriesChartYAxisOptions;
  thresholds?: ThresholdOptions;
  visual?: TimeSeriesChartVisualOptions;
  tooltip?: TooltipSpecOptions;
  querySettings?: QuerySettingsOptions[];
}

export interface QuerySettingsOptions {
  queryIndex: number;
  colorMode: 'fixed' | 'fixed-single';
  colorValue: string;
}

export type TimeSeriesChartOptionsEditorProps = OptionsEditorProps<TimeSeriesChartOptions>;

export interface TimeSeriesChartYAxisOptions {
  show?: boolean;
  label?: string;
  format?: FormatOptions;
  min?: number;
  max?: number;
}

export interface TooltipSpecOptions {
  enablePinning: boolean;
}

export interface TimeSeriesChartPaletteOptions {
  mode: 'auto' | 'categorical';
}

export type TimeSeriesChartVisualOptions = {
  display?: 'line' | 'bar';
  lineWidth?: number;
  areaOpacity?: number;
  showPoints?: 'auto' | 'always';
  palette?: TimeSeriesChartPaletteOptions;
  pointRadius?: number;
  stack?: StackOptions;
  connectNulls?: boolean;
};

export const DEFAULT_FORMAT: FormatOptions = {
  unit: 'decimal',
  shortValues: true,
};

export const DEFAULT_Y_AXIS: TimeSeriesChartYAxisOptions = {
  show: true,
  label: '',
  format: DEFAULT_FORMAT,
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

export const DEFAULT_LINE_WIDTH = 1.25;
export const DEFAULT_AREA_OPACITY = 0;

// How much larger datapoint symbols are than line width, also applied in VisualOptionsEditor.
export const POINT_SIZE_OFFSET = 1.5;
export const DEFAULT_POINT_RADIUS = DEFAULT_LINE_WIDTH + POINT_SIZE_OFFSET;

export const DEFAULT_CONNECT_NULLS = false;

export const DEFAULT_VISUAL: TimeSeriesChartVisualOptions = {
  lineWidth: DEFAULT_LINE_WIDTH,
  areaOpacity: DEFAULT_AREA_OPACITY,
  pointRadius: DEFAULT_POINT_RADIUS,
  connectNulls: DEFAULT_CONNECT_NULLS,
};

// Controls how often static threshold values should be plotted so threshold data shows
// in tooltip without flicker.
export const THRESHOLD_PLOT_INTERVAL = 15;

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

// None is equivalent to undefined since stack is optional
export type StackOptions = 'none' | 'all'; // TODO: add percent option support

export const STACK_CONFIG = {
  none: { label: 'None' },
  all: { label: 'All' },
  // TODO: enable option after 'Percent' implemented
  // percent: { label: 'Percent', disabled: true }, // hidden since not implemented yet
};

export const STACK_OPTIONS = Object.entries(STACK_CONFIG).map(([id, config]) => {
  return {
    id: id as StackOptions,
    ...config,
  };
});

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
