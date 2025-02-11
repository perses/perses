// Copyright 2024 The Perses Authors
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

import { ReactElement, useState } from 'react';
import { produce } from 'immer';
import { Button, Stack } from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import { QueryDefinition, QueryPluginType } from '@perses-dev/core';
import { useListPluginMetadata, usePlugin, usePluginRegistry } from '../../runtime';
import { QueryEditorContainer } from './QueryEditorContainer';

export interface MultiQueryEditorProps {
  queryTypes: QueryPluginType[];
  queries?: QueryDefinition[];
  onChange: (queries: QueryDefinition[]) => void;
}

function useDefaultQueryDefinition(queryTypes: QueryPluginType[]): {
  defaultInitialQueryDefinition: QueryDefinition;
  isLoading: boolean;
} {
  // Build the default query plugin
  // This will be used only if the queries are empty, to open a starting query

  // Firs the default query type
  const defaultQueryType = queryTypes[0]!;

  // Then the default plugin kind
  // Use as default the plugin kind explicitly set as default or the first in the list
  const { data: queryPlugins, isLoading } = useListPluginMetadata(queryTypes);
  const { defaultPluginKinds } = usePluginRegistry();
  const defaultQueryKind = defaultPluginKinds?.[defaultQueryType] ?? queryPlugins?.[0]?.spec.name ?? '';

  const { data: defaultQueryPlugin } = usePlugin(defaultQueryType, defaultQueryKind, {
    throwOnError: true,
    enabled: true,
  });

  // This default query definition is used if no query is provided initially or when we add a new query
  return {
    defaultInitialQueryDefinition: {
      kind: defaultQueryType,
      spec: {
        plugin: { kind: defaultQueryKind, spec: defaultQueryPlugin?.createInitialOptions() || {} },
      },
    },
    isLoading,
  };
}

/**
 * A component render a list of {@link QueryEditorContainer} for the given query definitions.
 * It allows adding, removing and editing queries.
 * @param queryTypes The list of query types that the underlying editor will propose
 * @param queries The list of query definitions to render
 * @param onChange The callback to call when the queries are modified
 * @constructor
 */
export function MultiQueryEditor({ queryTypes, queries = [], onChange }: MultiQueryEditorProps): ReactElement {
  const { defaultInitialQueryDefinition, isLoading } = useDefaultQueryDefinition(queryTypes);

  // State for which queries are collapsed
  const [queriesCollapsed, setQueriesCollapsed] = useState(queries.map(() => false));

  // Query handlers
  const handleQueryChange = (index: number, queryDef: QueryDefinition): void => {
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

  const handleQueryAdd = (): void => {
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

  const handleQueryDelete = (index: number): void => {
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

  const handleQueryCollapseExpand = (index: number): void => {
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed[index] = !queriesCollapsed[index];
      return [...queriesCollapsed];
    });
  };

  // show one query input if queries is empty
  const queryDefinitions: QueryDefinition[] = queries.length
    ? queries
    : !isLoading
      ? [defaultInitialQueryDefinition]
      : [];

  return (
    <>
      <Stack spacing={1}>
        {queryDefinitions.map((query: QueryDefinition, i: number) => (
          <QueryEditorContainer
            queryTypes={queryTypes}
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
