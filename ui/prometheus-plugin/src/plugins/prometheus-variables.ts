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

import { VariablePlugin, VariableOption, GetVariableOptionsContext } from '@perses-dev/plugin-system';
import { labelValues, labelNames } from '../model/prometheus-client';
import { replaceTemplateVariables, parseTemplateVariables } from '../model/utils';

interface PrometheusVariableOptionsBase {
  datasource?: string;
}

type PrometheusLabelNamesVariableOptions = PrometheusVariableOptionsBase;

type PrometheusLabelValuesVariableOptions = PrometheusVariableOptionsBase & {
  label_name: string;
  matchers?: [string];
};

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

function getQueryOptions(ctx: GetVariableOptionsContext) {
  const queryOptions = {
    // TODO: use the datasource from the definition
    datasource: ctx.datasources.defaultDatasource,
  };
  return queryOptions;
}

export const PrometheusLabelNamesVariable: VariablePlugin<PrometheusLabelNamesVariableOptions> = {
  getVariableOptions: async (spec, ctx) => {
    const queryOptions = getQueryOptions(ctx);
    const { data: options } = await labelNames({}, queryOptions);
    return {
      data: stringArrayToVariableOptions(options),
    };
  },
  dependsOn: () => [],
};

export const PrometheusLabelValuesVariable: VariablePlugin<PrometheusLabelValuesVariableOptions> = {
  getVariableOptions: async (spec, ctx) => {
    const pluginDef = spec;
    const queryOptions = getQueryOptions(ctx);
    const match = pluginDef.matchers
      ? pluginDef.matchers.map((m) => replaceTemplateVariables(m, ctx.variables))
      : undefined;
    const { data: options } = await labelValues({ labelName: pluginDef.label_name, 'match[]': match }, queryOptions);
    return {
      data: stringArrayToVariableOptions(options),
    };
  },
  dependsOn: (spec) => {
    return spec.matchers?.map((m) => parseTemplateVariables(m)).flat() || [];
  },
};
