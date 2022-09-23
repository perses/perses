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

import { VariablePlugin, VariableOption } from '@perses-dev/plugin-system';
import { labelValues, labelNames } from '../model/prometheus-client';

interface PrometheusVariableOptionsBase {
  datasource?: string;
  kind: string;
}

type PrometheusLabelNamesVariableOptions = PrometheusVariableOptionsBase & {
  kind: 'LabelNames';
};

type PrometheusLabelValuesVariableOptions = PrometheusVariableOptionsBase & {
  kind: 'LabelValues';
  spec: {
    label: string;
    query?: string;
  };
};

type PromVariableOptions = PrometheusLabelNamesVariableOptions | PrometheusLabelValuesVariableOptions;

/**
 * Takes a list of strings and returns a list of VariableOptions
 */
const stringArrayToVariableOptions = (values?: string[]): VariableOption[] => {
  if (!values) return [];
  return values.map((value) => ({
    value,
    label: value,
  }));
};

export const PrometheusVariable: VariablePlugin<PromVariableOptions> = {
  getVariableOptions: async (definition, ctx) => {
    const pluginDef = definition.spec.plugin.spec;

    let options;
    const queryOptions = {
      // TODO: use the datasource from the definition
      datasource: ctx.datasources.defaultDatasource,
    };

    if (pluginDef.kind === 'LabelValues') {
      const match = pluginDef.spec.query ? [pluginDef.spec.query] : undefined;
      const { data } = await labelValues({ labelName: pluginDef.spec.label, 'match[]': match }, queryOptions);
      options = data;
    }

    if (pluginDef.kind === 'LabelNames') {
      const { data } = await labelNames({}, queryOptions);
      options = data;
    }

    return {
      data: stringArrayToVariableOptions(options),
    };
  },
};
