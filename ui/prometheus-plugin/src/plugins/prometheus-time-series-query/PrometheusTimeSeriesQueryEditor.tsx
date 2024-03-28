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

import { produce } from 'immer';
import { DatasourceSelect, DatasourceSelectProps, useDatasource, useDatasourceClient } from '@perses-dev/plugin-system';
import { FormControl, InputLabel, Stack, TextField } from '@mui/material';
import {
  DEFAULT_PROM,
  DurationString,
  isDefaultPromSelector,
  isPrometheusDatasourceSelector,
  PROM_DATASOURCE_KIND,
  PrometheusClient,
} from '../../model';
import { DEFAULT_SCRAPE_INTERVAL, PrometheusDatasourceSpec } from '../types';
import { PromQLEditor } from '../../components';
import {
  PrometheusTimeSeriesQueryEditorProps,
  useQueryState,
  useFormatState,
  useMinStepState,
} from './query-editor-model';

/**
 * The options editor component for editing a PrometheusTimeSeriesQuery's spec.
 */
export function PrometheusTimeSeriesQueryEditor(props: PrometheusTimeSeriesQueryEditorProps) {
  const { onChange, value } = props;
  const { datasource } = value;
  const selectedDatasource = datasource ?? DEFAULT_PROM;
  const datasourceSelectLabelID = `prom-datasource-label-${selectedDatasource.name || 'default'}`;

  const { data: client } = useDatasourceClient<PrometheusClient>(selectedDatasource);
  const promURL = client?.options.datasourceUrl;
  const { data: datasourceResource } = useDatasource(selectedDatasource);

  const { query, handleQueryChange, handleQueryBlur } = useQueryState(props);
  const { format, handleFormatChange, handleFormatBlur } = useFormatState(props);
  const { minStep, handleMinStepChange, handleMinStepBlur } = useMinStepState(props);
  const minStepPlaceholder =
    minStep ??
    (datasourceResource && (datasourceResource?.plugin.spec as PrometheusDatasourceSpec).scrapeInterval) ??
    DEFAULT_SCRAPE_INTERVAL;

  const handleDatasourceChange: DatasourceSelectProps['onChange'] = (next) => {
    if (isPrometheusDatasourceSelector(next)) {
      onChange(
        produce(value, (draft) => {
          // If they're using the default, just omit the datasource prop (i.e. set to undefined)
          const nextDatasource = isDefaultPromSelector(next) ? undefined : next;
          draft.datasource = nextDatasource;
        })
      );
      return;
    }

    throw new Error('Got unexpected non-Prometheus datasource selector');
  };

  return (
    <Stack spacing={2}>
      <FormControl margin="dense" fullWidth={false}>
        <InputLabel id={datasourceSelectLabelID}>Prometheus Datasource</InputLabel>
        <DatasourceSelect
          datasourcePluginKind={PROM_DATASOURCE_KIND}
          value={selectedDatasource}
          onChange={handleDatasourceChange}
          labelId={datasourceSelectLabelID}
          label="Prometheus Datasource"
        />
      </FormControl>
      <PromQLEditor
        completeConfig={{ remote: { url: promURL } }}
        value={query}
        onChange={handleQueryChange}
        onBlur={handleQueryBlur}
      />
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          label="Legend Name"
          placeholder="Tip: Use {{label_name}}. Example: {{instance}} will be replaced with values such as 'webserver-123' and 'webserver-456'."
          helperText="Name for each series in the legend and the tooltip."
          value={format ?? ''}
          onChange={(e) => handleFormatChange(e.target.value)}
          onBlur={handleFormatBlur}
        />
        <TextField
          label="Min Step"
          placeholder={minStepPlaceholder}
          helperText="Step parameter of the query. Used by $__interval and $__rate_interval too."
          value={minStep}
          onChange={(e) => handleMinStepChange(e.target.value as DurationString)}
          onBlur={handleMinStepBlur}
          sx={{ width: '250px' }}
        />
      </Stack>
    </Stack>
  );
}
