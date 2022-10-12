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
import {
  replaceTemplateVariables,
  parseTemplateVariables,
  PrometheusClient,
  DEFAULT_PROM,
  PrometheusDatasourceSelector,
} from '../model';
import { JSONSpecEditor } from './JSONSpecEditor';

interface PrometheusVariableOptionsBase {
  datasource?: PrometheusDatasourceSelector;
}

type PrometheusLabelNamesVariableOptions = PrometheusVariableOptionsBase & {
  matchers?: [string];
};

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

export const PrometheusLabelNamesVariable: VariablePlugin<PrometheusLabelNamesVariableOptions> = {
  getVariableOptions: async (spec, ctx) => {
    const client: PrometheusClient = await ctx.datasourceStore.getDatasourceClient(spec.datasource ?? DEFAULT_PROM);
    const match = spec.matchers ? spec.matchers.map((m) => replaceTemplateVariables(m, ctx.variables)) : undefined;
    const { data: options } = await client.labelNames({ 'match[]': match });
    return {
      data: stringArrayToVariableOptions(options),
    };
  },
  dependsOn: () => [],
  OptionsEditorComponent: JSONSpecEditor,
  createInitialOptions: () => ({}),
};

export const PrometheusLabelValuesVariable: VariablePlugin<PrometheusLabelValuesVariableOptions> = {
  getVariableOptions: async (spec, ctx) => {
    const pluginDef = spec;
    const client: PrometheusClient = await ctx.datasourceStore.getDatasourceClient(spec.datasource ?? DEFAULT_PROM);
    const match = pluginDef.matchers
      ? pluginDef.matchers.map((m) => replaceTemplateVariables(m, ctx.variables))
      : undefined;
    const { data: options } = await client.labelValues({ labelName: pluginDef.label_name, 'match[]': match });
    return {
      data: stringArrayToVariableOptions(options),
    };
  },
  dependsOn: (spec) => {
    return spec.matchers?.map((m) => parseTemplateVariables(m)).flat() || [];
  },
  OptionsEditorComponent: JSONSpecEditor,
  createInitialOptions: () => ({ label_name: '' }),
};
