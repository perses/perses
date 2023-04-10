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

import { TimeSeriesQueryDefinition, ThresholdOptions } from '@perses-dev/core';
import { UnitOptions } from '@perses-dev/components';
import { CalculationType, OptionsEditorProps } from '@perses-dev/plugin-system';

export interface SparklineOptions {
  color?: string;
  width?: number;
}

export type StatChartOptionsEditorProps = OptionsEditorProps<StatChartOptions>;

export interface StatChartOptions {
  name: string;
  query: TimeSeriesQueryDefinition;
  calculation: CalculationType;
  unit: UnitOptions;
  thresholds?: ThresholdOptions;
  sparkline?: SparklineOptions;
  textAlignment?: 'auto' | 'center';
}

export function createInitialStatChartOptions(): StatChartOptions {
  return {
    name: '',
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
    unit: {
      kind: 'Decimal',
    },
    sparkline: {},
  };
}
