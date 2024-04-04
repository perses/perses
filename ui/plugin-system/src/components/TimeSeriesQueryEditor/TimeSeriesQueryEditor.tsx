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

import { useState } from 'react';
import { produce } from 'immer';
import { Button, Stack } from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import { TimeSeriesQueryDefinition, QueryDefinition } from '@perses-dev/core';
import { TIME_SERIES_QUERY_KEY, useListPluginMetadata, usePlugin, usePluginRegistry } from '../../runtime';
import { TimeSeriesQueryInput } from './TimeSeriesQueryInput';

export interface TimeSeriesQueryEditorProps {
  queries?: TimeSeriesQueryDefinition[];
  onChange: (queries: QueryDefinition[]) => void;
}

export function TimeSeriesQueryEditor({ queries = [], onChange }: TimeSeriesQueryEditorProps) {
  // Build the default query plugin
  // Use as default the plugin kind explicitly set as default or the first in the list
  const { defaultPluginKinds } = usePluginRegistry();
  const { data: timeSeriesPlugins } = useListPluginMetadata([TIME_SERIES_QUERY_KEY]);
  const defaultTimeSeriesQueryKind = defaultPluginKinds?.[TIME_SERIES_QUERY_KEY] ?? timeSeriesPlugins?.[0]?.kind ?? '';
  const { data: defaultQueryPlugin } = usePlugin(TIME_SERIES_QUERY_KEY, defaultTimeSeriesQueryKind, {
    useErrorBoundary: true,
    enabled: true,
  });

  // This default query definition is used if no query is provided initially or when we add a new query
  const defaultInitialQueryDefinition: TimeSeriesQueryDefinition = {
    kind: TIME_SERIES_QUERY_KEY,
    spec: {
      plugin: { kind: defaultTimeSeriesQueryKind, spec: defaultQueryPlugin?.createInitialOptions() || {} },
    },
  };

  // State for which queries are collapsed
  // TODO: Would be easier if we had IDs for queries.
  const [queriesCollapsed, setQueriesCollapsed] = useState(queries.map(() => false));

  // Query handlers
  const handleQueryChange = (index: number, queryDef: TimeSeriesQueryDefinition) => {
    onChange(
      produce(queries, (draft) => {
        if (draft) {
          draft[index] = queryDef;
        } else {
          draft = [queryDef];
        }
      })
    );
  };

  const handleQueryAdd = () => {
    if (!defaultQueryPlugin) return;
    onChange(
      produce(queries, (draft) => {
        if (draft) {
          draft.push(defaultInitialQueryDefinition);
        } else {
          draft = [...queries, defaultInitialQueryDefinition];
        }
      })
    );
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed.push(false);
      return [...queriesCollapsed];
    });
  };

  const handleQueryDelete = (index: number) => {
    onChange(
      produce(queries, (draft) => {
        draft.splice(index, 1);
      })
    );
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed.splice(index, 1);
      return [...queriesCollapsed];
    });
  };

  const handleQueryCollapseExpand = (index: number) => {
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed[index] = !queriesCollapsed[index];
      return [...queriesCollapsed];
    });
  };

  // show one query input if queries is empty
  const queryDefinitions: TimeSeriesQueryDefinition[] = queries.length ? queries : [defaultInitialQueryDefinition];

  return (
    <>
      <Stack spacing={1}>
        {queryDefinitions.map((query: TimeSeriesQueryDefinition, i: number) => (
          <TimeSeriesQueryInput
            key={i}
            index={i}
            query={query}
            isCollapsed={!!queriesCollapsed[i]}
            onChange={handleQueryChange}
            onDelete={queries.length > 1 ? handleQueryDelete : undefined}
            onCollapseExpand={handleQueryCollapseExpand}
          />
        ))}
      </Stack>
      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleQueryAdd}>
        Add Query
      </Button>
    </>
  );
}
