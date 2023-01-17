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

import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { UnitOptions } from '@perses-dev/components';
import { CalculationType, OptionsEditorProps } from '@perses-dev/plugin-system';
import { ThresholdOptions } from '../../model/thresholds';

export const DEFAULT_UNIT: UnitOptions = { kind: 'PercentDecimal', decimal_places: 1 };

export const DEFAULT_MAX_PERCENT = 100;

export const DEFAULT_MAX_PERCENT_DECIMAL = 1;

export type GaugeChartOptionsEditorProps = OptionsEditorProps<GaugeChartOptions>;

/**
 * The Options object type supported by the GaugeChart panel plugin.
 */
export interface GaugeChartOptions {
  query: TimeSeriesQueryDefinition;
  calculation: CalculationType;
  unit?: UnitOptions;
  thresholds?: ThresholdOptions;
  max?: number;
}

/**
 * Creates the initial/empty options for a GaugeChart panel.
 */
export function createInitialGaugeChartOptions(): GaugeChartOptions {
  return {
    // TODO: How do you represent an initially empty/unset graph query?
    query: {
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
    calculation: 'LastNumber',
    unit: DEFAULT_UNIT,
    thresholds: {
      steps: [
        {
          value: 0.8,
        },
        {
          value: 0.9,
        },
      ],
    },
  };
}
