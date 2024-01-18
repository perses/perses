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

import { DatasourceSelectProps, useDatasourceClient } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import { DEFAULT_TEMPO, isDefaultTempoSelector, isTempoDatasourceSelector } from '../../model/tempo-selectors';
import { TempoClient } from '../../model/tempo-client';
import { TraceQueryEditorProps, useQueryState } from './query-editor-model';
import { DashboardTempoTraceQueryEditor } from './DashboardTempoTraceQueryEditor';

export function TempoTraceQueryEditor(props: TraceQueryEditorProps) {
  const { onChange, value } = props;
  const { datasource } = value;
  const selectedDatasource = datasource ?? DEFAULT_TEMPO;

  const { data: client } = useDatasourceClient<TempoClient>(selectedDatasource);
  const datasourceURL = client?.options.datasourceUrl;

  const { query, handleQueryChange, handleQueryBlur } = useQueryState(props);

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
    <DashboardTempoTraceQueryEditor
      selectedDatasource={selectedDatasource}
      handleDatasourceChange={handleDatasourceChange}
      datasourceURL={datasourceURL}
      query={query}
      handleQueryChange={handleQueryChange}
      handleQueryBlur={handleQueryBlur}
    />
  );
}
