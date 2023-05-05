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
import { Stack, TextField, FormControl, InputLabel } from '@mui/material';
import { DatasourceSelect, DatasourceSelectProps, useDatasourceClient } from '@perses-dev/plugin-system';
import { DEFAULT_PROM, isDefaultPromSelector, isPrometheusDatasourceSelector, PrometheusClient } from '../../model';
import { PromQLEditor } from '../../components';
import { PrometheusTimeSeriesQueryEditorProps, useQueryState, useFormatState } from './query-editor-model';

/**
 * The options editor component for editing a PrometheusTimeSeriesQuery's spec.
 */
export function PrometheusTimeSeriesQueryEditor(props: PrometheusTimeSeriesQueryEditorProps) {
  const { onChange, value } = props;
  const { datasource } = value;
  const selectedDatasource = datasource ?? DEFAULT_PROM;

  const { data: client } = useDatasourceClient<PrometheusClient>(selectedDatasource);
  const promURL = client?.options.datasourceUrl;

  const { query, handleQueryChange, handleQueryBlur } = useQueryState(props);
  const { format, handleFormatChange, handleFormatBlur } = useFormatState(props);

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
      <PromQLEditor
        completeConfig={{ remote: { url: promURL } }}
        value={query}
        onChange={handleQueryChange}
        onBlur={handleQueryBlur}
      />
      <TextField
        fullWidth
        label="Legend Name"
        placeholder="Tip: Use {{label_name}}. Example: {{instance}} will be replaced with values such as 'webserver-123' and 'webserver-456'."
        helperText="Set the name for each series in the legend and the tooltip."
        value={format ?? ''}
        onChange={(e) => handleFormatChange(e.target.value)}
        onBlur={handleFormatBlur}
      />
      <FormControl margin="dense" fullWidth={false}>
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
    </Stack>
  );
}
