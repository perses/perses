// Copyright 2021 The Perses Authors
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

import { PluginSetupFunction } from '@perses-ui/core';
import {
  PrometheusRangeChartQueryKind,
  usePrometheusTimeSeriesQuery,
} from './plugins/time-series-query';
import { IntervalKind, useIntervalValues } from './plugins/interval-variable';
import {
  PrometheusLabelNamesKind,
  usePrometheusLabelNames,
} from './plugins/label-names-variable';
import {
  PrometheusLabelValuesKind,
  usePrometheusLabelValues,
} from './plugins/label-values-variable';

export const setup: PluginSetupFunction = (registerPlugin) => {
  registerPlugin({
    pluginType: 'Variable',
    kind: PrometheusLabelNamesKind,
    validate: undefined, // TODO
    plugin: {
      useVariableOptions: usePrometheusLabelNames,
    },
  });
  registerPlugin({
    pluginType: 'Variable',
    kind: PrometheusLabelValuesKind,
    validate: undefined, // TODO
    plugin: {
      useVariableOptions: usePrometheusLabelValues,
    },
  });
  registerPlugin({
    pluginType: 'Variable',
    kind: IntervalKind,
    validate: undefined, // TODO
    plugin: {
      useVariableOptions: useIntervalValues,
    },
  });
  registerPlugin({
    pluginType: 'TimeSeriesQuery',
    kind: PrometheusRangeChartQueryKind,
    validate: undefined, // TODO
    plugin: {
      useTimeSeriesQuery: usePrometheusTimeSeriesQuery,
    },
  });
};
