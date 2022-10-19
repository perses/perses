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

import { ChangeEvent } from 'react';
import produce from 'immer';
import { Box, TextField, FormControl, InputLabel } from '@mui/material';
import { OptionsEditorProps, DatasourceSelect, DatasourceSelectProps } from '@perses-dev/plugin-system';
import { DEFAULT_PROM, isDefaultPromSelector, isPrometheusDatasourceSelector } from '../model';
import { PrometheusTimeSeriesQuerySpec } from './time-series-query';

export type PrometheusTimeSeriesQueryEditorProps = OptionsEditorProps<PrometheusTimeSeriesQuerySpec>;

export function PrometheusTimeSeriesQueryEditor(props: PrometheusTimeSeriesQueryEditorProps) {
  const { onChange, value } = props;
  const { query, datasource } = value;

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(
      produce(value, (draft) => {
        draft.query = e.target.value;
      })
    );
  };

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
    <Box>
      <TextField fullWidth label="Query" value={query} onChange={handleQueryChange} margin="dense" />
      <FormControl margin="dense" fullWidth={false}>
        {/* TODO: How do we ensure unique ID values if there are multiple of these? Can we use React 18 useId and
            maintain 17 compatibility somehow with a polyfill/shim? */}
        <InputLabel id="prom-datasource-label">Prometheus Datasource</InputLabel>
        <DatasourceSelect
          datasourcePluginKind="PrometheusDatasource"
          value={datasource ?? DEFAULT_PROM}
          onChange={handleDatasourceChange}
          labelId="prom-datasource-label"
          label="Prometheus Datasource"
        />
      </FormControl>
    </Box>
  );
}
