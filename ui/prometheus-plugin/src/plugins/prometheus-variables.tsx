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
import {
  DatasourceSelect,
  DatasourceSelectProps,
  OptionsEditorProps,
  useDatasourceClient,
  VariableOption,
  VariablePlugin,
  parseTemplateVariables,
  replaceTemplateVariables,
  useValidation,
} from '@perses-dev/plugin-system';
import { Stack, TextField } from '@mui/material';
import { produce } from 'immer';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import { useEffect } from 'react';
import {
  DEFAULT_PROM,
  getPrometheusTimeRange,
  isDefaultPromSelector,
  isPrometheusDatasourceSelector,
  MatrixData,
  PROM_DATASOURCE_KIND,
  PrometheusClient,
  VectorData,
} from '../model';
import { PromQLEditor } from '../components';
import {
  PrometheusLabelNamesVariableOptions,
  PrometheusLabelValuesVariableOptions,
  PrometheusPromQLVariableOptions,
} from './types';
import { MatcherEditor } from './MatcherEditor';

function PrometheusLabelValuesVariableEditor(props: OptionsEditorProps<PrometheusLabelValuesVariableOptions>) {
  const { onChange, value } = props;
  const { datasource } = value;
  const selectedDatasource = datasource ?? DEFAULT_PROM;

  const handleDatasourceChange: DatasourceSelectProps['onChange'] = (next) => {
    if (isPrometheusDatasourceSelector(next)) {
      onChange(
        produce(value, (draft) => {
          // If they're using the default, just omit the datasource prop (i.e. set to undefined)
          draft.datasource = isDefaultPromSelector(next) ? undefined : next;
        })
      );
      return;
    }

    throw new Error('Got unexpected non-Prometheus datasource selector');
  };

  const { setVariablePluginEditorFormSchema } = useValidation();
  useEffect(() => {
    setVariablePluginEditorFormSchema(
      z.object({
        listVariableFields: z.object({
          plugin: z.object({
            spec: z.object({
              datasource: z.object({
                kind: z.string(),
                group: z.string().optional(),
                name: z.string().optional(),
              }),
              labelName: z.string().nonempty(),
            }),
          }),
        }),
      })
    );
  }, [setVariablePluginEditorFormSchema]);

  return (
    <Stack spacing={2}>
      <Controller
        name="listVariableFields.plugin.spec.datasource"
        render={({ field, fieldState }) => (
          <DatasourceSelect
            {...field}
            datasourcePluginKind={PROM_DATASOURCE_KIND}
            value={selectedDatasource}
            InputProps={{
              readOnly: props.isReadonly,
            }}
            label="Prometheus Datasource"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event);
              handleDatasourceChange(event);
            }}
          />
        )}
      />
      <Controller
        name="listVariableFields.plugin.spec.labelName"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="Label Name"
            required
            value={props.value.labelName}
            InputProps={{
              readOnly: props.isReadonly,
            }}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event);
              props.onChange({ ...props.value, labelName: event.target.value });
            }}
          />
        )}
      />
      <MatcherEditor // TODO: validation
        matchers={props.value.matchers ?? []}
        onChange={(e) => {
          props.onChange({ ...props.value, matchers: e });
        }}
        isReadonly={props.isReadonly}
      />
    </Stack>
  );
}

function PrometheusLabelNamesVariableEditor(props: OptionsEditorProps<PrometheusLabelNamesVariableOptions>) {
  const { onChange, value } = props;
  const { datasource } = value;
  const selectedDatasource = datasource ?? DEFAULT_PROM;

  const handleDatasourceChange: DatasourceSelectProps['onChange'] = (next) => {
    if (isPrometheusDatasourceSelector(next)) {
      onChange(
        produce(value, (draft) => {
          // If they're using the default, just omit the datasource prop (i.e. set to undefined)
          draft.datasource = isDefaultPromSelector(next) ? undefined : next;
        })
      );
      return;
    }

    throw new Error('Got unexpected non-Prometheus datasource selector');
  };

  const { setVariablePluginEditorFormSchema } = useValidation();
  useEffect(() => {
    setVariablePluginEditorFormSchema(
      z.object({
        listVariableFields: z.object({
          plugin: z.object({
            spec: z.object({
              datasource: z.object({
                kind: z.string(),
                group: z.string().optional(),
                name: z.string().optional(),
              }),
            }),
          }),
        }),
      })
    );
  }, [setVariablePluginEditorFormSchema]);

  return (
    <Stack spacing={2}>
      <Controller
        name="listVariableFields.plugin.spec.datasource"
        render={({ field, fieldState }) => (
          <DatasourceSelect
            {...field}
            datasourcePluginKind={PROM_DATASOURCE_KIND}
            value={selectedDatasource}
            InputProps={{
              readOnly: props.isReadonly,
            }}
            label="Prometheus Datasource"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event);
              handleDatasourceChange(event);
            }}
          />
        )}
      />
      <MatcherEditor // TODO: validation
        matchers={props.value.matchers ?? []}
        isReadonly={props.isReadonly}
        onChange={(e) => {
          props.onChange({ ...props.value, matchers: e });
        }}
      />
    </Stack>
  );
}

function PrometheusPromQLVariableEditor(props: OptionsEditorProps<PrometheusPromQLVariableOptions>) {
  const { onChange, value } = props;
  const { datasource } = value;
  const selectedDatasource = datasource ?? DEFAULT_PROM;

  const { data: client } = useDatasourceClient<PrometheusClient>(selectedDatasource);
  const promURL = client?.options.datasourceUrl;

  const handleDatasourceChange: DatasourceSelectProps['onChange'] = (next) => {
    if (isPrometheusDatasourceSelector(next)) {
      onChange(
        produce(value, (draft) => {
          // If they're using the default, just omit the datasource prop (i.e. set to undefined)
          draft.datasource = isDefaultPromSelector(next) ? undefined : next;
        })
      );
      return;
    }

    throw new Error('Got unexpected non-Prometheus datasource selector');
  };

  const { setVariablePluginEditorFormSchema } = useValidation();
  useEffect(() => {
    setVariablePluginEditorFormSchema(
      z.object({
        listVariableFields: z.object({
          plugin: z.object({
            spec: z.object({
              datasource: z.object({
                kind: z.string(),
                group: z.string().optional(),
                name: z.string().optional(),
              }),
              expr: z.string(),
              labelName: z.string().nonempty('Required'),
            }),
          }),
        }),
      })
    );
  }, [setVariablePluginEditorFormSchema]);

  return (
    <Stack spacing={2}>
      <Controller
        name="listVariableFields.plugin.spec.datasource"
        render={({ field, fieldState }) => (
          <DatasourceSelect
            {...field}
            datasourcePluginKind={PROM_DATASOURCE_KIND}
            value={selectedDatasource}
            InputProps={{
              readOnly: props.isReadonly,
            }}
            label="Prometheus Datasource"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event);
              handleDatasourceChange(event);
            }}
          />
        )}
      />
      <Controller
        name="listVariableFields.plugin.spec.expr"
        render={({ field }) => (
          <PromQLEditor
            {...field}
            completeConfig={{ remote: { url: promURL } }}
            value={value.expr}
            readOnly={props.isReadonly}
            width="100%"
            onChange={(event) => {
              field.onChange(event);
              props.onChange({ ...props.value, expr: event });
            }}
          />
        )}
      />
      <Controller
        name="listVariableFields.plugin.spec.labelName"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="Label Name"
            value={props.value.labelName}
            InputProps={{
              readOnly: props.isReadonly,
            }}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event);
              props.onChange({ ...props.value, labelName: event.target.value });
            }}
          />
        )}
      />
    </Stack>
  );
}

function capturingMatrix(matrix: MatrixData, labelName: string): string[] {
  const captured = new Set<string>();
  for (const sample of matrix.result) {
    const value = sample.metric[labelName];
    if (value !== undefined) {
      captured.add(value);
    }
  }
  return Array.from(captured.values());
}

function capturingVector(vector: VectorData, labelName: string): string[] {
  const captured = new Set<string>();
  for (const sample of vector.result) {
    const value = sample.metric[labelName];
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
      labelName: replaceTemplateVariables(pluginDef.labelName, ctx.variables),
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
          .concat(parseTemplateVariables(spec.labelName)) || [],
    };
  },
  OptionsEditorComponent: PrometheusLabelValuesVariableEditor,
  createInitialOptions: () => ({ labelName: '' }),
};

export const PrometheusPromQLVariable: VariablePlugin<PrometheusPromQLVariableOptions> = {
  getVariableOptions: async (spec, ctx) => {
    const client: PrometheusClient = await ctx.datasourceStore.getDatasourceClient(spec.datasource ?? DEFAULT_PROM);
    // TODO we may want to manage a range query as well.
    const { data: options } = await client.instantQuery({
      query: replaceTemplateVariables(spec.expr, ctx.variables),
    });
    const labelName = replaceTemplateVariables(spec.labelName, ctx.variables);
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
    return { variables: parseTemplateVariables(spec.expr).concat(parseTemplateVariables(spec.labelName)) };
  },
  OptionsEditorComponent: PrometheusPromQLVariableEditor,
  createInitialOptions: () => ({ expr: '', labelName: '' }),
};
