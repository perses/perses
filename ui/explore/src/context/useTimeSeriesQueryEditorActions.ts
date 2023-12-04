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

import { QueryDefinition, TimeSeriesQueryDefinition } from '@perses-dev/core';
import { usePlugin, usePluginRegistry } from '@perses-dev/plugin-system';
import produce from 'immer';
import { useCallback, useMemo, useState } from 'react';

const DEFAULT_QUERY_PLUGIN_TYPE = 'TimeSeriesQuery';

export interface TimeSeriesQueryEditorActionsProps {
  queries: QueryDefinition[];
  onChange: (queries: QueryDefinition[]) => void;
}

export const useTimeSeriesQueryEditorActions = (props: TimeSeriesQueryEditorActionsProps) => {
  const { queries, onChange } = props;
  const { defaultPluginKinds } = usePluginRegistry();
  const defaultTimeSeriesQueryKind = defaultPluginKinds?.[DEFAULT_QUERY_PLUGIN_TYPE] ?? '';
  const { data: defaultQueryPlugin } = usePlugin(DEFAULT_QUERY_PLUGIN_TYPE, defaultTimeSeriesQueryKind, {
    useErrorBoundary: true,
    enabled: true,
  });

  const [queriesCollapsed, setQueriesCollapsed] = useState(queries.map(() => false));

  const handleQueryChange = useCallback(
    (index: number, queryDef: QueryDefinition) => {
      onChange(
        produce(queries, (draft) => {
          if (draft) {
            draft[index] = queryDef;
            return;
          }
          draft = [queryDef];
        })
      );
    },
    [onChange, queries]
  );

  const handleQueryAdd = useCallback(() => {
    if (!defaultQueryPlugin) return;
    onChange(
      produce(queries, (draft) => {
        const queryDef: TimeSeriesQueryDefinition = {
          kind: DEFAULT_QUERY_PLUGIN_TYPE,
          spec: {
            plugin: { kind: defaultTimeSeriesQueryKind, spec: defaultQueryPlugin.createInitialOptions() },
          },
        };

        if (draft) {
          draft.push(queryDef);
        } else {
          draft = [...queries, queryDef];
        }
      })
    );
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed.push(false);
      return [...queriesCollapsed];
    });
  }, [defaultQueryPlugin, defaultTimeSeriesQueryKind, onChange, queries, setQueriesCollapsed]);

  const handleQueryDelete = useCallback(
    (index: number) => {
      onChange(
        produce(queries, (draft) => {
          draft.splice(index, 1);
        })
      );
      setQueriesCollapsed((queriesCollapsed) => {
        queriesCollapsed.splice(index, 1);
        return [...queriesCollapsed];
      });
    },
    [onChange, setQueriesCollapsed, queries]
  );

  const handleQueryCollapseExpand = useCallback(
    (index: number) => {
      setQueriesCollapsed((queriesCollapsed) => {
        queriesCollapsed[index] = !queriesCollapsed[index];
        return [...queriesCollapsed];
      });
    },
    [setQueriesCollapsed]
  );

  return useMemo(() => {
    return {
      handleQueryChange,
      handleQueryAdd,
      handleQueryDelete,
      handleQueryCollapseExpand,
      queriesCollapsed,
      defaultTimeSeriesQueryKind,
    };
  }, [
    handleQueryChange,
    handleQueryAdd,
    handleQueryDelete,
    handleQueryCollapseExpand,
    queriesCollapsed,
    defaultTimeSeriesQueryKind,
  ]);
};
