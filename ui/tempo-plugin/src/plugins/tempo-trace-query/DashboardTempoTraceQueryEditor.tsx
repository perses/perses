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

import { Stack, FormControl, InputLabel } from '@mui/material';
import { DatasourceSelect } from '@perses-dev/plugin-system';
import { DatasourceSelector } from '@perses-dev/core';
import { TempoDatasourceSelector, TEMPO_DATASOURCE_KIND } from '../../model/tempo-selectors';
import { TraceQLEditor } from './TraceQLEditor';

interface DashboardTempoTraceQueryEditorProps {
  selectedDatasource: TempoDatasourceSelector;
  handleDatasourceChange: (next: DatasourceSelector) => void;
  datasourceURL: string | undefined;
  query: string;
  handleQueryChange: (e: string) => void;
  handleQueryBlur: () => void;
}

export function DashboardTempoTraceQueryEditor(props: DashboardTempoTraceQueryEditorProps) {
  const { selectedDatasource, handleDatasourceChange, datasourceURL, query, handleQueryChange, handleQueryBlur } =
    props;

  return (
    <Stack spacing={2}>
      <FormControl margin="dense" fullWidth={false}>
        {/* TODO: How do we ensure unique ID values if there are multiple of these? Can we use React 18 useId and
                maintain 17 compatibility somehow with a polyfill/shim? */}
        <InputLabel id="tempo-datasource-label">Tempo Datasource</InputLabel>
        <DatasourceSelect
          datasourcePluginKind={TEMPO_DATASOURCE_KIND}
          value={selectedDatasource}
          onChange={handleDatasourceChange}
          labelId="tempo-datasource-label"
          label="Tempo Datasource"
        />
      </FormControl>
      <TraceQLEditor
        completeConfig={{ remote: { url: datasourceURL } }}
        value={query}
        onChange={handleQueryChange}
        onBlur={handleQueryBlur}
      />
    </Stack>
  );
}
