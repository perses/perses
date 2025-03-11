// Copyright 2025 The Perses Authors
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

import { DatasourceSelect, DatasourceSelectProps, useDatasourceClient } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import { FormControl, InputLabel, Stack, TextField } from '@mui/material';
import { ReactElement } from 'react';
import {
  DEFAULT_TEMPO,
  isDefaultTempoSelector,
  isTempoDatasourceSelector,
  TEMPO_DATASOURCE_KIND,
} from '../../model/tempo-selectors';
import { TempoClient } from '../../model/tempo-client';
import { TraceQLEditor } from '../../components';
import { TraceQueryEditorProps, useLimitState, useQueryState } from './query-editor-model';

export function TempoTraceQueryEditor(props: TraceQueryEditorProps): ReactElement {
  const { onChange, value } = props;
  const { datasource } = value;
  const selectedDatasource = datasource ?? DEFAULT_TEMPO;

  const { data: client } = useDatasourceClient<TempoClient>(selectedDatasource);

  const { query, handleQueryChange, handleQueryBlur } = useQueryState(props);
  const { limit, handleLimitChange, handleLimitBlur, limitHasError } = useLimitState(props);

  const handleDatasourceChange: DatasourceSelectProps['onChange'] = (next) => {
    if (isTempoDatasourceSelector(next)) {
      onChange(
        produce(value, (draft) => {
          // If they're using the default, just omit the datasource prop (i.e. set to undefined)
          const nextDatasource = isDefaultTempoSelector(next) ? undefined : next;
          draft.datasource = nextDatasource;
        })
      );
      return;
    }

    throw new Error('Got unexpected non-Tempo datasource selector');
  };

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
      <Stack direction="row" spacing={2}>
        <TraceQLEditor
          completeConfig={{ client }}
          value={query}
          onChange={handleQueryChange}
          onBlur={handleQueryBlur}
        />
        <TextField
          label="Max Traces"
          value={limit}
          error={limitHasError}
          onChange={(e) => handleLimitChange(e.target.value)}
          onBlur={handleLimitBlur}
          sx={{ width: '110px' }}
        />
      </Stack>
    </Stack>
  );
}
