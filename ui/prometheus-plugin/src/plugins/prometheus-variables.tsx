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
import { PrometheusClient, DEFAULT_PROM, getPrometheusTimeRange, MatrixData, VectorData } from '../model';
import { replaceTemplateVariables, parseTemplateVariables } from '../utils';
import {
  PrometheusLabelNamesVariableOptions,
  PrometheusLabelValuesVariableOptions,
  PrometheusPromQLVariableOptions,
} from './types';
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
        matchers={props.value.matchers ?? []}
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
        matchers={props.value.matchers ?? []}
        onChange={(e) => {
          props.onChange({ ...props.value, matchers: e });
        }}
      />
    </Stack>
  );
}

function PrometheusPromQLVariableEditor(props: OptionsEditorProps<PrometheusPromQLVariableOptions>) {
  return (
    <Stack spacing={1}>
      <TextField
        sx={{ mb: 1 }}
        label="PromQL Expression"
        value={props.value.expr}
        onChange={(e) => {
          props.onChange({ ...props.value, expr: e.target.value });
        }}
      />
      <TextField
        sx={{ mb: 1 }}
        label="Label Name"
        value={props.value.label_name}
        onChange={(e) => {
          props.onChange({ ...props.value, label_name: e.target.value });
        }}
      />
    </Stack>
  );
}

function capturingMatrix(matrix: MatrixData, label_name: string): string[] {
  const captured = new Set<string>();
  for (const sample of matrix.result) {
    const value = sample.metric[label_name];
    if (value !== undefined) {
      captured.add(value);
    }
  }
  return Array.from(captured.values());
}

function capturingVector(vector: VectorData, label_name: string): string[] {
  const captured = new Set<string>();
  for (const sample of vector.result) {
    const value = sample.metric[label_name];
    if (value !== undefined) {
      captured.add(value);
    }
  }
  return Array.from(captured.values());
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

export const PrometheusPromQLVariable: VariablePlugin<PrometheusPromQLVariableOptions> = {
  getVariableOptions: async (spec, ctx) => {
    const client: PrometheusClient = await ctx.datasourceStore.getDatasourceClient(spec.datasource ?? DEFAULT_PROM);
    // TODO we may want to manage a range query as well.
    const { data: options } = await client.instantQuery({
      query: replaceTemplateVariables(spec.expr, ctx.variables),
    });
    const labelName = replaceTemplateVariables(spec.label_name, ctx.variables);
    let values: string[] = [];
    if (options?.resultType === 'matrix') {
      values = capturingMatrix(options, labelName);
    } else if (options?.resultType === 'vector') {
      values = capturingVector(options, labelName);
    }

    return {
      data: stringArrayToVariableOptions(values),
    };
  },
  dependsOn: (spec) => {
    return { variables: parseTemplateVariables(spec.expr).concat(parseTemplateVariables(spec.label_name)) };
  },
  OptionsEditorComponent: PrometheusPromQLVariableEditor,
  createInitialOptions: () => ({ expr: '', label_name: '' }),
};
