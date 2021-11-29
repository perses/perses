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

import { AnyVariableDefinition, DashboardSpec, DEFAULT_ALL_VALUE } from '@perses-ui/core';
import { GrafanaVariable } from './grafana-json-model';

const LABEL_NAMES = /^label_names\(\)\s*$/;
const LABEL_VALUES = /^label_values\((?:(.+),\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\)\s*$/;
const METRIC_NAMES = /^metrics\((.+)\)\s*$/;
const QUERY_RESULT = /^query_result\((.+)\)\s*$/;

export function convertVariables(grafanaVariables: GrafanaVariable[]): DashboardSpec['variables'] {
  const variables: DashboardSpec['variables'] = {};
  for (const grafanaVariable of grafanaVariables) {
    if (grafanaVariable.name === '') continue;

    // Just punt on these for now
    if (grafanaVariable.type === 'datasource') continue;

    // TODO: This is just a static list of options, so we should support
    if (grafanaVariable.type === 'custom') continue;

    const { name, query, label, hide } = grafanaVariable;

    // Figure out selection options
    let selection: AnyVariableDefinition['selection'];
    if (grafanaVariable.multi === false) {
      const { current } = grafanaVariable;
      selection = {
        default_value: 'value' in current ? current.value : '',
      };
    } else {
      const { current, includeAll, allValue } = grafanaVariable;
      selection = {
        default_value: current.value,
        all_value: includeAll === false ? undefined : allValue ?? DEFAULT_ALL_VALUE,
      };
    }

    // Figure out other common options
    const def: AnyVariableDefinition = {
      kind: '',
      options: {},
      display: {
        label: label ?? name,
        // TODO: Should we support hiding the label?
        hide: hide === 2 ? true : false,
      },
      selection,
    };

    // Is a label names query?
    const labelNames = query.match(LABEL_NAMES);
    if (labelNames !== null) {
      def.kind = 'PrometheusLabelNames';
      // Grafana doesn't support label_names(metric), just label_names()
      def.options.match = [];
      variables[name] = def;
      continue;
    }

    // Is a label values query?
    const labelValues = query.match(LABEL_VALUES);
    if (labelValues !== null) {
      const [, matcher, labelName] = labelValues;
      def.kind = 'PrometheusLabelValues';
      def.options.label_name = labelName;

      // Grafana allows label_values(labelName) or label_values(matcher, labelName)
      def.options.match = [];
      if (matcher !== undefined) {
        def.options.match.push(matcher);
      }
      variables[name] = def;
      continue;
    }

    // Is a metric names query?
    const metricNames = query.match(METRIC_NAMES);
    if (metricNames !== null) {
      def.kind = 'PrometheusLabelValues';
      def.options.label_name = '__name__';
      // TODO: Grafana allows metrics(RegExp) where RegExp is used to filter
      // results on the client side, should we support that?
      variables[name] = def;
      continue;
    }

    // Is a query result query?
    const queryResult = query.match(QUERY_RESULT);
    if (queryResult !== null) {
      // TODO: Grafana supports query_result(promQLExpression) to run an instant
      // query and then maps the results to options. Should we support?
    }
  }
  return variables;
}
