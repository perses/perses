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
import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { ThresholdOptions } from '../../model/thresholds';

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
  min?: number;
  max?: number;
}

export type VisualOptions = {
  // type: 'line' | 'bar' | 'scatter'; // TODO: new option to change series type
  point_radius?: number;
  line_width?: number;
};

export const DEFAULT_UNIT: UnitOptions = {
  kind: 'Decimal',
  decimal_places: 2,
  abbreviate: true,
};

export const DEFAULT_LINE_WIDTH = 1.5;

export const DEFAULT_POINT_RADIUS = 4;

export const DEFAULT_VISUAL: VisualOptions = {
  line_width: DEFAULT_LINE_WIDTH,
  point_radius: DEFAULT_POINT_RADIUS,
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
