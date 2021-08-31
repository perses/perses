import { PluginSetupFunction } from '@perses-ui/core';
import {
  PrometheusInstantChartQueryKind,
  usePrometheusInstantChartQuery,
} from './plugins/instant-chart-query';
import {
  PrometheusRangeChartQueryKind,
  usePrometheusRangeChartQuery,
} from './plugins/range-chart-query';
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
    pluginType: 'ChartQuery',
    kind: PrometheusInstantChartQueryKind,
    validate: undefined, // TODO
    plugin: {
      useChartQuery: usePrometheusInstantChartQuery,
    },
  });
  registerPlugin({
    pluginType: 'ChartQuery',
    kind: PrometheusRangeChartQueryKind,
    validate: undefined, // TODO
    plugin: {
      useChartQuery: usePrometheusRangeChartQuery,
    },
  });
};
