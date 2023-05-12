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
} from '@perses-dev/plugin-system';
import { FormControl, InputLabel, Stack, TextField } from '@mui/material';
import { produce } from 'immer';
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
import { parseTemplateVariables, replaceTemplateVariables } from '../utils';
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

  return (
    <Stack spacing={2}>
      <FormControl margin="dense">
        {/* TODO: How do we ensure unique ID values if there are multiple of these? Can we use React 18 useId and
            maintain 17 compatibility somehow with a polyfill/shim? */}
        <InputLabel id="prom-datasource-label">Prometheus Datasource</InputLabel>
        <DatasourceSelect
          datasourcePluginKind="PrometheusDatasource"
          value={selectedDatasource}
          onChange={handleDatasourceChange}
          labelId="prom-datasource-label"
          label="Prometheus Datasource"
        />
      </FormControl>
      <TextField
        label="Label Name"
        required
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

  return (
    <Stack spacing={2}>
      <FormControl margin="dense">
        {/* TODO: How do we ensure unique ID values if there are multiple of these? Can we use React 18 useId and
            maintain 17 compatibility somehow with a polyfill/shim? */}
        <InputLabel id="prom-datasource-label">Prometheus Datasource</InputLabel>
        <DatasourceSelect
          datasourcePluginKind="PrometheusDatasource"
          value={selectedDatasource}
          onChange={handleDatasourceChange}
          labelId="prom-datasource-label"
          label="Prometheus Datasource"
        />
      </FormControl>
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

  return (
    <Stack spacing={2}>
      <FormControl margin="dense">
        {/* TODO: How do we ensure unique ID values if there are multiple of these? Can we use React 18 useId and
            maintain 17 compatibility somehow with a polyfill/shim? */}
        <InputLabel id="prom-datasource-label">Prometheus Datasource</InputLabel>
        <DatasourceSelect
          datasourcePluginKind={PROM_DATASOURCE_KIND}
          value={selectedDatasource}
          onChange={handleDatasourceChange}
          labelId="prom-datasource-label"
          label="Prometheus Datasource"
        />
      </FormControl>
      <PromQLEditor
        completeConfig={{ remote: { url: promURL } }}
        value={value.expr}
        onChange={(query) => {
          props.onChange({ ...props.value, expr: query });
        }}
        width="100%"
      />
      <TextField
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
