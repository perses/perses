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

import { UnitOptions, LegendOptions } from '@perses-dev/components';
import { TimeSeriesQueryDefinition, ThresholdOptions } from '@perses-dev/core';
import { OptionsEditorProps } from '@perses-dev/plugin-system';

/**
 * The Options object supported by the TimeSeriesChartPanel plugin.
 */
export interface TimeSeriesChartOptions {
  queries: TimeSeriesQueryDefinition[];
  legend?: LegendOptions;
  y_axis?: YAxisOptions;
  unit?: UnitOptions;
  thresholds?: ThresholdOptions;
  visual?: VisualOptions;
}

export type TimeSeriesChartOptionsEditorProps = OptionsEditorProps<TimeSeriesChartOptions>;

export interface YAxisOptions {
  show?: boolean;
  label?: string;
  unit?: UnitOptions;
  min?: YAxisMin;
  max?: number;
}

export type YAxisMin = number | 'ScaleToData';

export interface PaletteOptions {
  kind: 'Auto' | 'Categorical';
  // colors: string []; // TODO: add colors to override ECharts theme
}

export type VisualOptions = {
  line_width?: number;
  area_opacity?: number;
  show_points?: 'Auto' | 'Always';
  palette?: PaletteOptions;
  point_radius?: number;
  stack?: StackOptions;
  connect_nulls?: boolean;
};

export const DEFAULT_UNIT: UnitOptions = {
  kind: 'Decimal',
  decimal_places: 2,
  abbreviate: true,
};

export const DEFAULT_LINE_WIDTH = 1.5;

export const DEFAULT_AREA_OPACITY = 0;

export const DEFAULT_PALETTE: PaletteOptions = {
  kind: 'Auto',
};

export const DEFAULT_POINT_RADIUS = 4;

export const DEFAULT_CONNECT_NULLS = false;

export const DEFAULT_VISUAL: VisualOptions = {
  line_width: DEFAULT_LINE_WIDTH,
  area_opacity: DEFAULT_AREA_OPACITY,
  palette: DEFAULT_PALETTE,
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

export const DEFAULT_Y_AXIS: YAxisOptions = {
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

/**
 * Creates an initial/empty options object for the TimeSeriesChartPanel.
 */
export function createInitialTimeSeriesChartOptions(): TimeSeriesChartOptions {
  return {
    queries: [
      {
        kind: 'TimeSeriesQuery',
        spec: {
          plugin: {
            kind: 'PrometheusTimeSeriesQuery',
            spec: {
              query: '',
            },
          },
        },
      },
    ],
  };
}
