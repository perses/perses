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

import { TimeSeriesQueryPlugin, parseVariables } from '@perses-dev/plugin-system';
import { getTimeSeriesData } from './get-time-series-data';
import { PrometheusTimeSeriesQueryEditor } from './PrometheusTimeSeriesQueryEditor';
import { PrometheusTimeSeriesQuerySpec } from './time-series-query-model';

/**
 * The core Prometheus TimeSeriesQuery plugin for Perses.
 */
export const PrometheusTimeSeriesQuery: TimeSeriesQueryPlugin<PrometheusTimeSeriesQuerySpec> = {
  getTimeSeriesData,
  OptionsEditorComponent: PrometheusTimeSeriesQueryEditor,
  createInitialOptions: () => ({
    query: '',
    datasource: undefined,
  }),
  dependsOn: (spec) => {
    // Variables can be used in the query and/or in the legend format string
    const queryVariables = parseVariables(spec.query);
    const legendVariables = parseVariables(spec.seriesNameFormat || '');
    const allVariables = [...new Set([...queryVariables, ...legendVariables])];
    return {
      variables: allVariables,
    };
  },
};
