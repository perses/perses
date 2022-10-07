// Copyright 2022 The Perses Authors
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

import { UnitOptions } from '@perses-dev/components';
import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { ThresholdOptions } from '../../model/thresholds';

/**
 * The Options object supported by the TimeSeriesChartPanel plugin.
 */
export interface TimeSeriesChartOptions {
  queries: TimeSeriesQueryDefinition[];
  show_legend?: boolean;
  unit?: UnitOptions;
  thresholds?: ThresholdOptions;
}

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
    // TODO: configurable legend, change from show_legend to legend.show
    show_legend: true,
    unit: {
      kind: 'Decimal',
    },
  };
}
