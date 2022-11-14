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
import { VariablePlugin, VariableOption, OptionsEditorProps } from '@perses-dev/plugin-system';
import { Stack, TextField } from '@mui/material';
import {
  replaceTemplateVariables,
  parseTemplateVariables,
  PrometheusClient,
  DEFAULT_PROM,
  getPrometheusTimeRange,
} from '../model';
import { PrometheusLabelNamesVariableOptions, PrometheusLabelValuesVariableOptions } from './types';
import { MatcherEditor } from './MatcherEditor';

function PrometheusLabelValuesVariableEditor(props: OptionsEditorProps<PrometheusLabelValuesVariableOptions>) {
  return (
    <Stack spacing={1}>
      <TextField
        sx={{ mb: 1 }}
        label="Label Name"
        value={props.value.label_name}
        onChange={(e) => {
          props.onChange({ ...props.value, label_name: e.target.value });
        }}
      />
      <MatcherEditor
        initialMatchers={props.value.matchers}
        onChange={(e) => {
          props.onChange({ ...props.value, matchers: e });
        }}
      />
    </Stack>
  );
}

function PrometheusLabelNamesVariableEditor(props: OptionsEditorProps<PrometheusLabelNamesVariableOptions>) {
  return (
    <Stack spacing={1}>
      <MatcherEditor
        initialMatchers={props.value.matchers}
        onChange={(e) => {
          props.onChange({ ...props.value, matchers: e });
        }}
      />
    </Stack>
  );
}

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
    const timeRange = getPrometheusTimeRange(ctx.timeRange);

    const { data: options } = await client.labelNames({ 'match[]': match, ...timeRange });
    return {
      data: stringArrayToVariableOptions(options),
    };
  },
  dependsOn: (spec) => {
    return { variables: spec.matchers?.map((m) => parseTemplateVariables(m)).flat() || [] };
  },
  OptionsEditorComponent: PrometheusLabelNamesVariableEditor,
  createInitialOptions: () => ({}),
};

export const PrometheusLabelValuesVariable: VariablePlugin<PrometheusLabelValuesVariableOptions> = {
  getVariableOptions: async (spec, ctx) => {
    const pluginDef = spec;
    const client: PrometheusClient = await ctx.datasourceStore.getDatasourceClient(spec.datasource ?? DEFAULT_PROM);
    const match = pluginDef.matchers
      ? pluginDef.matchers.map((m) => replaceTemplateVariables(m, ctx.variables))
      : undefined;

    const timeRange = getPrometheusTimeRange(ctx.timeRange);

    const { data: options } = await client.labelValues({
      labelName: replaceTemplateVariables(pluginDef.label_name, ctx.variables),
      'match[]': match,
      ...timeRange,
    });
    return {
      data: stringArrayToVariableOptions(options),
    };
  },
  dependsOn: (spec) => {
    return {
      variables:
        spec.matchers
          ?.map((m) => parseTemplateVariables(m))
          .flat()
          .concat(parseTemplateVariables(spec.label_name)) || [],
    };
  },
  OptionsEditorComponent: PrometheusLabelValuesVariableEditor,
  createInitialOptions: () => ({ label_name: '' }),
};
